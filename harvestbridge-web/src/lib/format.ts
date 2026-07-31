export function formatNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? new Intl.NumberFormat().format(number) : '0';
}

export function formatCurrency(value: unknown) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return 'LKR 0';
  }

  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(number);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function titleCase(value?: string | null) {
  if (!value) {
    return 'Unknown';
  }

  return value
    .replace(/_/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
