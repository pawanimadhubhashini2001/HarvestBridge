<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>HarvestBridge AI Report</title>

    <style>

        body{
            font-family: DejaVu Sans;
            font-size:13px;
        }

        h1{
            color:#2E7D32;
            text-align:center;
        }

        table{
            width:100%;
            border-collapse:collapse;
            margin-bottom:20px;
        }

        td,th{
            border:1px solid #ccc;
            padding:8px;
        }

        th{
            background:#E8F5E9;
        }

    </style>

</head>

<body>

<h1>HarvestBridge AI Recommendation Report</h1>

<h3>Farmer Inputs</h3>

<table>

<tr><th>District</th><td>{{ $input['District'] }}</td></tr>

<tr><th>Season</th><td>{{ $input['Season'] }}</td></tr>

<tr><th>Soil Type</th><td>{{ $input['Soil_Type'] }}</td></tr>

<tr><th>pH</th><td>{{ $input['pH'] }}</td></tr>

</table>

<h3>Weather</h3>

<table>

<tr><th>Temperature</th><td>{{ $weather['temperature'] }} °C</td></tr>

<tr><th>Humidity</th><td>{{ $weather['humidity'] }} %</td></tr>

<tr><th>Rainfall</th><td>{{ $weather['rainfall'] }} mm</td></tr>

</table>

<h3>Recommendation</h3>

<table>

<tr>

<th>Crop</th>

<td>{{ $prediction['recommended_crop'] }}</td>

</tr>

<tr>

<th>Confidence</th>

<td>{{ number_format($prediction['confidence']*100,2) }}%</td>

</tr>

</table>

<h3>Explanation</h3>

<table>

@foreach($prediction['explanation'] as $key=>$value)

<tr>

<th>{{ ucfirst($key) }}</th>

<td>{{ $value }}</td>

</tr>

@endforeach

</table>

@if($market)

<h3>Market Price</h3>

<table>

<tr>
    <th>Market</th>
    <td>{{ $market['market_name'] }}</td>
</tr>

<tr>
    <th>District</th>
    <td>{{ $market['district'] }}</td>
</tr>

<tr>
    <th>Price</th>
    <td>Rs. {{ $market['price_per_unit'] }}/{{ $market['unit'] }}</td>
</tr>

</table>

@endif

<p>

Generated on:

{{ now()->format('d M Y H:i') }}

</p>

</body>
</html>
