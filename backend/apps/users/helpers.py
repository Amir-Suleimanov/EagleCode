def build_initials(full_name: str) -> str:
    return "".join(part[0] for part in full_name.split() if part)[:2].upper()
