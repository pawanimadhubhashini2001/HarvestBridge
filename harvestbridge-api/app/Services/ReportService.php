<?php

namespace App\Services;

use App\Models\Farm;
use App\Models\PredictionHistory;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportService
{
    public function __construct(
        protected AIAnalyticsService $analyticsService,
        protected AuditLogService $auditLogService
    ) {}

    public function cropReport(User $user, ?string $from = null, ?string $to = null): array
    {
        return [
            'summary' => $this->analyticsService->dashboard($user, $from, $to),
            'most_recommended_crops' => $this->analyticsService->mostRecommendedCrops($user, $from, $to),
            'seasonal_analytics' => $this->analyticsService->seasonalAnalytics($user, $from, $to),
        ];
    }

    public function farmReport(User $user): array
    {
        $farms = Farm::query()
            ->where('user_id', $user->id)
            ->withCount('harvestListings')
            ->get();

        return [
            'total_farms' => $farms->count(),
            'total_farm_size' => round((float) $farms->sum('farm_size'), 2),
            'districts' => $farms->pluck('district')->filter()->unique()->values(),
            'farms' => $farms->map(fn (Farm $farm) => [
                'id' => $farm->id,
                'farm_name' => $farm->farm_name,
                'district' => $farm->district,
                'farm_size' => $farm->farm_size,
                'farm_size_unit' => $farm->farm_size_unit,
                'soil_type' => $farm->soil_type,
                'harvest_listings_count' => $farm->harvest_listings_count,
            ]),
        ];
    }

    public function aiReport(User $user, ?string $from = null, ?string $to = null): array
    {
        return [
            'dashboard' => $this->analyticsService->dashboard($user, $from, $to),
            'confidence_analytics' => $this->analyticsService->confidenceAnalytics($user, $from, $to),
            'recommendation_trends' => $this->analyticsService->recommendationTrends($user, $from, $to),
            'favorite_statistics' => $this->analyticsService->favoriteStatistics($user, $from, $to),
        ];
    }

    public function exportAiReportCsv(User $user, ?string $from = null, ?string $to = null): StreamedResponse
    {
        $histories = PredictionHistory::query()
            ->where('user_id', $user->id)
            ->when($from, fn ($query) => $query->whereDate('created_at', '>=', $from))
            ->when($to, fn ($query) => $query->whereDate('created_at', '<=', $to))
            ->latest()
            ->get();

        $this->auditLogService->log('report.ai.csv.exported', $user->id, null, [
            'from' => $from,
            'to' => $to,
            'total' => $histories->count(),
        ]);

        return response()->streamDownload(function () use ($histories) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'ID',
                'District',
                'Season',
                'Soil Type',
                'Recommended Crop',
                'Confidence',
                'Favorite',
                'Created At',
            ]);

            foreach ($histories as $history) {
                fputcsv($handle, [
                    $history->id,
                    $history->district,
                    $history->season,
                    $history->soil_type,
                    $history->recommended_crop,
                    $history->confidence,
                    $history->is_favorite ? 'Yes' : 'No',
                    $history->created_at?->toDateTimeString(),
                ]);
            }

            fclose($handle);
        }, 'ai-report.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function advancedPdf(User $user, array $reportData, string $type): Response
    {
        $pdf = Pdf::loadView('reports.advanced', [
            'type' => $type,
            'generatedAt' => now(),
            'user' => $user,
            'reportData' => $reportData,
        ]);

        $this->auditLogService->log('report.pdf.generated', $user->id, null, [
            'type' => $type,
        ]);

        return $pdf->download("{$type}-report.pdf");
    }
}
