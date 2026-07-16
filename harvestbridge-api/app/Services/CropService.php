<?php

namespace App\Services;

use App\Models\Crop;

class CropService
{
    public function getAll()
    {
        return Crop::orderBy('crop_name')->get();
    }

    public function create(array $data)
    {
        return Crop::create($data);
    }

    public function update(Crop $crop, array $data)
    {
        $crop->update($data);

        return $crop->fresh();
    }

    public function delete(Crop $crop)
    {
        $crop->delete();
    }
}
