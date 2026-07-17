<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class RecommendationReportController extends Controller
{
    public function download(Request $request)
    {
        $pdf = Pdf::loadView(
            'reports.recommendation',
            [
                'input' => $request->input('input'),
                'weather' => $request->input('weather'),
                'prediction' => $request->input('prediction'),
                'market' => $request->input('market'),
            ]
        );

        return $pdf->download('recommendation-report.pdf');
    }
}
