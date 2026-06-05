import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TagFilterDropdown from './TagFilterDropdown';

const TAGS = ['battery', 'motor', 'power'];
const TAG_COUNTS = { battery: 2, motor: 5, power: 1 };

describe('TagFilterDropdown', () => {
  it('renders a chip for every available tag', () => {
    render(<TagFilterDropdown tags={TAGS} activeTags={[]} onTagToggle={vi.fn()} />);
    for (const tag of TAGS) {
      expect(screen.getByRole('button', { name: tag })).toBeInTheDocument();
    }
  });

  it('shows the empty state when no tags are available', () => {
    render(<TagFilterDropdown tags={[]} activeTags={[]} onTagToggle={vi.fn()} />);
    expect(screen.getByText(/no tags in database/i)).toBeInTheDocument();
  });

  it('marks active tags with aria-pressed="true"', () => {
    render(<TagFilterDropdown tags={TAGS} activeTags={['motor']} onTagToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'motor' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'battery' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('applies the active CSS class only to selected chips', () => {
    render(<TagFilterDropdown tags={TAGS} activeTags={['power']} onTagToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'power' })).toHaveClass('tag-chip--active');
    expect(screen.getByRole('button', { name: 'battery' })).not.toHaveClass('tag-chip--active');
  });

  it('calls onTagToggle with the tag name when a chip is clicked', async () => {
    const onTagToggle = vi.fn();
    const user = userEvent.setup();
    render(<TagFilterDropdown tags={TAGS} activeTags={[]} onTagToggle={onTagToggle} />);
    await user.click(screen.getByRole('button', { name: 'motor' }));
    expect(onTagToggle).toHaveBeenCalledWith('motor');
  });

  it('calls onTagToggle when an already-active chip is clicked (to deselect it)', async () => {
    const onTagToggle = vi.fn();
    const user = userEvent.setup();
    render(<TagFilterDropdown tags={TAGS} activeTags={['motor']} onTagToggle={onTagToggle} />);
    await user.click(screen.getByRole('button', { name: 'motor' }));
    expect(onTagToggle).toHaveBeenCalledWith('motor');
  });

  it('displays the item count next to each tag chip', () => {
    render(<TagFilterDropdown tags={TAGS} activeTags={[]} onTagToggle={vi.fn()} tagCounts={TAG_COUNTS} />);
    expect(screen.getByText('5')).toBeInTheDocument(); // motor count
    expect(screen.getByText('2')).toBeInTheDocument(); // battery count
  });

  it('shows 0 for a tag with no matching count entry', () => {
    render(<TagFilterDropdown tags={['newTag']} activeTags={[]} onTagToggle={vi.fn()} tagCounts={{}} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
