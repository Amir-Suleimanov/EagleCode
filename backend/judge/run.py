"""EagleCode judge runner: executed inside the sandbox container.

Reads ``{source, tests, timeLimitMs, memoryLimitMb}`` from stdin and prints a JSON
report. Standard library only, so the image stays a plain python:slim.
"""

import json
import os
import py_compile
import resource
import signal
import subprocess
import sys
import time

WORKDIR = "/tmp"
OUTPUT_LIMIT = 16 * 1024 * 1024
LOG_LIMIT = 1500


def compare_output(actual, expected):
    return actual.split() == expected.split()


def run_test(test, time_limit, memory_limit):
    def apply_limits():
        resource.setrlimit(resource.RLIMIT_AS, (memory_limit, memory_limit))
        resource.setrlimit(resource.RLIMIT_FSIZE, (OUTPUT_LIMIT, OUTPUT_LIMIT))
        os.setsid()

    input_path, output_path, error_path = (
        os.path.join(WORKDIR, name) for name in ("input.txt", "output.txt", "stderr.txt")
    )
    with open(input_path, "w", encoding="utf-8") as handle:
        handle.write(test["input"])
    with (
        open(input_path, "rb") as stdin,
        open(output_path, "wb") as stdout,
        open(error_path, "wb") as stderr,
    ):
        started = time.perf_counter()
        process = subprocess.Popen(
            [sys.executable, "-B", os.path.join(WORKDIR, "solution.py")],
            stdin=stdin,
            stdout=stdout,
            stderr=stderr,
            cwd=WORKDIR,
            env={"PYTHONIOENCODING": "utf-8", "PATH": os.environ.get("PATH", "")},
            preexec_fn=apply_limits,
        )
        timed_out = False
        while True:
            pid, status, usage = os.wait4(process.pid, os.WNOHANG)
            if pid:
                break
            if time.perf_counter() - started > time_limit:
                timed_out = True
                os.killpg(process.pid, signal.SIGKILL)
                pid, status, usage = os.wait4(process.pid, 0)
                break
            time.sleep(0.002)
        elapsed_ms = int((time.perf_counter() - started) * 1000)

    with open(error_path, encoding="utf-8", errors="replace") as handle:
        log = handle.read()[-LOG_LIMIT:]
    if timed_out:
        verdict = "time_limit"
    elif "MemoryError" in log:
        verdict = "memory_limit"
    elif os.waitstatus_to_exitcode(status) != 0:
        verdict = "runtime_error"
    else:
        with open(output_path, encoding="utf-8", errors="replace") as handle:
            verdict = (
                "accepted" if compare_output(handle.read(), test["output"]) else "wrong_answer"
            )
    result = {
        "verdict": verdict,
        "timeMs": min(elapsed_ms, int(time_limit * 1000)),
        "memoryKb": usage.ru_maxrss,
        "sample": bool(test.get("sample")),
    }
    return result, log


def main():
    payload = json.load(sys.stdin)
    solution = os.path.join(WORKDIR, "solution.py")
    with open(solution, "w", encoding="utf-8") as handle:
        handle.write(payload["source"])
    try:
        py_compile.compile(solution, cfile=os.path.join(WORKDIR, "solution.pyc"), doraise=True)
    except py_compile.PyCompileError as error:
        print(json.dumps({"compileError": True, "log": str(error.msg)[-LOG_LIMIT:], "tests": []}))
        return

    time_limit = payload["timeLimitMs"] / 1000
    memory_limit = payload["memoryLimitMb"] * 1024 * 1024
    tests, first_log = [], ""
    for index, test in enumerate(payload["tests"], start=1):
        result, log = run_test(test, time_limit, memory_limit)
        tests.append({"test": index, **result})
        if result["verdict"] != "accepted" and not first_log and log:
            first_log = f"Тест {index}:\n{log}"
    print(json.dumps({"compileError": False, "log": first_log, "tests": tests}))


if __name__ == "__main__":
    main()
