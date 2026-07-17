<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ strtoupper($type) }} Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 12px; }
        h1, h2 { margin-bottom: 8px; }
        .muted { color: #6b7280; }
        .section { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f3f4f6; }
        .pre { white-space: pre-wrap; word-break: break-word; }
    </style>
</head>
<body>
    <h1>{{ strtoupper($type) }} Report</h1>
    <p class="muted">Generated at: {{ $generatedAt->format('Y-m-d H:i:s') }}</p>
    <p class="muted">User: {{ $user->name }} ({{ $user->email }})</p>

    @foreach($reportData as $key => $value)
        <div class="section">
            <h2>{{ ucwords(str_replace('_', ' ', $key)) }}</h2>

            @if(is_iterable($value))
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($value as $innerKey => $innerValue)
                            <tr>
                                <td>{{ is_string($innerKey) ? $innerKey : 'item_' . $loop->iteration }}</td>
                                <td class="pre">{{ is_scalar($innerValue) || $innerValue === null ? $innerValue : json_encode($innerValue, JSON_PRETTY_PRINT) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <p class="pre">{{ is_scalar($value) || $value === null ? $value : json_encode($value, JSON_PRETTY_PRINT) }}</p>
            @endif
        </div>
    @endforeach
</body>
</html>
