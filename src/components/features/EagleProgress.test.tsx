import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { eagleLevels } from '../../domain/eagleLevels';
import { EagleProgress } from './EagleProgress';

describe('EagleProgress', () => {
  it('renders consistent level and remaining meters', () => {
    render(<EagleProgress meters={12_480} levels={eagleLevels}/>);
    expect(screen.getByText(/Орёл IV — Сильное крыло/)).toBeInTheDocument();
    expect(screen.getByText(/осталось 1 520 м/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '83');
  });
});

