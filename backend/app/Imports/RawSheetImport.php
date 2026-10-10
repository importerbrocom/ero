<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;

/**
 * Minimal import concern — reads a sheet into a raw 2D array so the
 * QuestionImporter can do its own header mapping and row-level validation.
 */
class RawSheetImport implements ToArray
{
    public function array(array $array): void
    {
        // Not used directly; Excel::toArray() returns the parsed data.
    }
}
