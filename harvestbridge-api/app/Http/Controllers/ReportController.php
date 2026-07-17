<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\ReportFilterRequest;
use App\Services\ReportService;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    public function crop(ReportFilterRequest $request)
    {
        $data = $request->validated();

        return ApiResponse::success(
            $this->reportService->cropReport(
                $request->user(),
                $data['from'] ?? null,
                $data['to'] ?? null
            ),
            'Crop report generated successfully.'
        );
    }

    public function farm(ReportFilterRequest $request)
    {
        return ApiResponse::success(
            $this->reportService->farmReport($request->user()),
            'Farm report generated successfully.'
        );
    }

    public function ai(ReportFilterRequest $request)
    {
        $data = $request->validated();

        return ApiResponse::success(
            $this->reportService->aiReport(
                $request->user(),
                $data['from'] ?? null,
                $data['to'] ?? null
            ),
            'AI report generated successfully.'
        );
    }

    public function exportExcel(ReportFilterRequest $request)
    {
        $data = $request->validated();

        return $this->reportService->exportAiReportCsv(
            $request->user(),
            $data['from'] ?? null,
            $data['to'] ?? null
        );
    }

    public function advancedPdf(ReportFilterRequest $request)
    {
        $data = $request->validated();
        $type = $data['type'] ?? 'ai';

        $reportData = match ($type) {
            'crop' => $this->reportService->cropReport(
                $request->user(),
                $data['from'] ?? null,
                $data['to'] ?? null
            ),
            'farm' => $this->reportService->farmReport($request->user()),
            default => $this->reportService->aiReport(
                $request->user(),
                $data['from'] ?? null,
                $data['to'] ?? null
            ),
        };

        return $this->reportService->advancedPdf(
            $request->user(),
            $reportData,
            $type
        );
    }
}
