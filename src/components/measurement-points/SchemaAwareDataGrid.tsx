import React, { useState, useMemo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
    Download, 
    Upload, 
    AlertCircle, 
    CheckCircle2, 
    Edit, 
    Trash2,
    Filter,
    Eye,
    MoreHorizontal,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { csvImportService, type ImportResult, type MeasurementPointImportRow } from '@/services/csv-import-service';
import { csvTemplateService } from '@/services/csv-template-service';
import { schemaValidator, type ValidationResult } from '@/services/schema-validator';
import { measurementTypeOptions, heightReferenceOptions, statisticTypeOptions } from '@/utils/enum-options';
import type { 
    IEATask43Schema, 
    MeasurementPoint, 
    MeasurementType, 
    HeightReference, 
    StatisticType 
} from '@/types/schema';

interface SchemaAwareDataGridProps {
    locationIndex: number;
    loggerIdentifier: string;
    data: MeasurementPoint[];
    onUpdate: (data: MeasurementPoint[]) => void;
}

interface ValidationSummaryProps {
    validationResults: ValidationResult[];
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ validationResults }) => {
    const totalPoints = validationResults.length;
    const validPoints = validationResults.filter(result => result.isValid).length;
    const invalidPoints = totalPoints - validPoints;

    if (totalPoints === 0) return null;

    return (
        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                    {validPoints} Valid
                </span>
            </div>
            {invalidPoints > 0 && (
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                        {invalidPoints} Invalid
                    </span>
                </div>
            )}
            <div className="text-xs text-muted-foreground">
                {totalPoints} total measurement points
            </div>
        </div>
    );
};

interface CSVImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (result: ImportResult) => void;
    locationIndex: number;
    loggerIdentifier: string;
}

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({
    isOpen,
    onClose,
    onImport,
    locationIndex,
    loggerIdentifier
}) => {
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewMappings, setPreviewMappings] = useState<any[]>([]);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setCsvFile(file);
        setImportResult(null);
        setPreviewMappings([]);

        // Generate preview mappings
        try {
            const text = await file.text();
            const mappings = await csvImportService.getSuggestedMappings(text);
            setPreviewMappings(mappings);
        } catch (error) {
            console.error('Error previewing CSV:', error);
        }
    };

    const handleImport = async () => {
        if (!csvFile) return;

        setIsProcessing(true);
        try {
            const text = await csvFile.text();
            const result = await csvImportService.importCSV(text, locationIndex, loggerIdentifier);
            setImportResult(result);
            
            if (result.success) {
                onImport(result);
            }
        } catch (error) {
            console.error('Import error:', error);
            setImportResult({
                success: false,
                validRows: [],
                invalidRows: [],
                warnings: [{
                    type: 'error',
                    message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
                summary: { totalRows: 0, validRows: 0, invalidRows: 0, skippedRows: 0 }
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadTemplate = () => {
        const template = csvTemplateService.generateTemplate(false);
        const csvContent = csvTemplateService.generateFullTemplate(template);
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'measurement_points_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Measurement Points from CSV</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Template Download */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium">Download Template</h4>
                            <p className="text-sm text-muted-foreground">
                                Get a CSV template with proper column formats and examples
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleDownloadTemplate}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Template
                        </Button>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="csv-file">Select CSV File</Label>
                        <Input
                            id="csv-file"
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Preview Mappings */}
                    {previewMappings.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-medium">Column Mapping Preview</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Column Name</TableHead>
                                            <TableHead>Detected Type</TableHead>
                                            <TableHead>Height</TableHead>
                                            <TableHead>Statistic</TableHead>
                                            <TableHead>Confidence</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewMappings.map((mapping, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{mapping.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={mapping.measurementType === 'other' ? 'secondary' : 'default'}>
                                                        {mapping.measurementType.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{mapping.height ? `${mapping.height}m` : 'N/A'}</TableCell>
                                                <TableCell>{mapping.statisticType}</TableCell>
                                                <TableCell>
                                                    <Badge variant={mapping.confidence > 0.7 ? 'default' : mapping.confidence > 0.4 ? 'secondary' : 'destructive'}>
                                                        {Math.round(mapping.confidence * 100)}%
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Import Results */}
                    {importResult && (
                        <div className="space-y-3">
                            <h4 className="font-medium">Import Results</h4>
                            
                            {/* Summary */}
                            <div className="grid grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-3">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {importResult.summary.totalRows}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Total Columns</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-3">
                                        <div className="text-2xl font-bold text-green-600">
                                            {importResult.summary.validRows}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Valid Points</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-3">
                                        <div className="text-2xl font-bold text-red-600">
                                            {importResult.summary.invalidRows}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Invalid Points</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-3">
                                        <div className="text-2xl font-bold text-gray-600">
                                            {importResult.summary.skippedRows}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Skipped</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Warnings and Errors */}
                            {importResult.warnings.length > 0 && (
                                <div className="space-y-2">
                                    {importResult.warnings.map((warning, index) => (
                                        <Alert key={index} variant={warning.type === 'error' ? 'destructive' : 'default'}>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                {warning.message}
                                                {warning.suggestedFix && (
                                                    <div className="mt-1 text-sm font-medium">
                                                        Suggestion: {warning.suggestedFix}
                                                    </div>
                                                )}
                                            </AlertDescription>
                                        </Alert>
                                    ))}
                                </div>
                            )}

                            {/* Invalid Rows Details */}
                            {importResult.invalidRows.length > 0 && (
                                <div className="space-y-2">
                                    <h5 className="font-medium text-red-600">Invalid Measurement Points</h5>
                                    <div className="max-h-40 overflow-y-auto border rounded">
                                        {importResult.invalidRows.map((row, index) => (
                                            <div key={index} className="p-2 border-b last:border-b-0">
                                                <div className="font-medium text-sm">
                                                    {row.rawData.columnHeader}
                                                </div>
                                                {row.validation.errors.map((error, errorIndex) => (
                                                    <div key={errorIndex} className="text-xs text-red-600 mt-1">
                                                        {error.message}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleImport} 
                        disabled={!csvFile || isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Import CSV'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const SchemaAwareDataGrid: React.FC<SchemaAwareDataGridProps> = ({
    locationIndex,
    loggerIdentifier,
    data,
    onUpdate
}) => {
    const { setValue, watch } = useFormContext<IEATask43Schema>();
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
    const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [bulkEditValues, setBulkEditValues] = useState<Partial<MeasurementPoint>>({});

    // Validate data in real-time
    useEffect(() => {
        const validateData = async () => {
            const results = await Promise.all(
                data.map(point => schemaValidator.validatePath(point, 'measurement_location.items.properties.measurement_point.items'))
            );
            setValidationResults(results);
        };

        if (data.length > 0) {
            validateData();
        } else {
            setValidationResults([]);
        }
    }, [data]);

    // Generate columns from schema (simplified for this implementation)
    const columns = useMemo(() => {
        return [
            { key: 'name', label: 'Name', required: true },
            { key: 'measurement_type_id', label: 'Type', required: true },
            { key: 'height_m', label: 'Height (m)', required: false },
            { key: 'height_reference_id', label: 'Height Ref', required: false },
            { key: 'unit', label: 'Unit', required: false, helper: true }
        ];
    }, []);

    const handleCSVImport = (result: ImportResult) => {
        if (result.success && result.validRows.length > 0) {
            // Convert import rows to measurement points
            const newPoints = result.validRows.map(row => row.mappedData as MeasurementPoint);
            
            // Add to existing data
            const updatedData = [...data, ...newPoints];
            onUpdate(updatedData);
            
            // Update form
            setValue(`measurement_location.${locationIndex}.measurement_point`, updatedData);
        }
        setIsCSVImportOpen(false);
    };

    const handleCellEdit = (rowIndex: number, field: string, value: any) => {
        const updatedData = [...data];
        updatedData[rowIndex] = { ...updatedData[rowIndex], [field]: value };
        onUpdate(updatedData);
        
        // Update form
        setValue(`measurement_location.${locationIndex}.measurement_point`, updatedData);
    };

    const handleRemovePoint = (index: number) => {
        const updatedData = data.filter((_, i) => i !== index);
        onUpdate(updatedData);
        setValue(`measurement_location.${locationIndex}.measurement_point`, updatedData);
    };

    const handleBulkEdit = () => {
        const updatedData = [...data];
        selectedRows.forEach(index => {
            updatedData[index] = { ...updatedData[index], ...bulkEditValues };
        });
        onUpdate(updatedData);
        setValue(`measurement_location.${locationIndex}.measurement_point`, updatedData);
        setSelectedRows(new Set());
        setBulkEditValues({});
    };

    const toggleRowSelection = (index: number) => {
        const newSelection = new Set(selectedRows);
        if (newSelection.has(index)) {
            newSelection.delete(index);
        } else {
            newSelection.add(index);
        }
        setSelectedRows(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedRows.size === data.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(data.map((_, index) => index)));
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsCSVImportOpen(true)}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                    </Button>
                    
                    {selectedRows.size > 0 && (
                        <Button onClick={handleBulkEdit}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Selected ({selectedRows.size})
                        </Button>
                    )}
                </div>

                <div className="text-sm text-muted-foreground">
                    {data.length} measurement points
                </div>
            </div>

            {/* Validation Summary */}
            <ValidationSummary validationResults={validationResults} />

            {/* Bulk Edit Panel */}
            {selectedRows.size > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Bulk Edit {selectedRows.size} Points</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs">Measurement Type</Label>
                                <SearchableSelect
                                    options={measurementTypeOptions}
                                    value={bulkEditValues.measurement_type_id}
                                    onValueChange={(value) => 
                                        setBulkEditValues(prev => ({ ...prev, measurement_type_id: value as MeasurementType }))
                                    }
                                    placeholder="Select type..."
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Height (m)</Label>
                                <Input
                                    type="number"
                                    value={bulkEditValues.height_m || ''}
                                    onChange={(e) => 
                                        setBulkEditValues(prev => ({ ...prev, height_m: parseFloat(e.target.value) }))
                                    }
                                    placeholder="Height..."
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Height Reference</Label>
                                <SearchableSelect
                                    options={heightReferenceOptions}
                                    value={bulkEditValues.height_reference_id}
                                    onValueChange={(value) => 
                                        setBulkEditValues(prev => ({ ...prev, height_reference_id: value as HeightReference }))
                                    }
                                    placeholder="Select reference..."
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={selectedRows.size === data.length && data.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            {columns.map(column => (
                                <TableHead key={column.key}>
                                    <div className="flex items-center gap-1">
                                        {column.label}
                                        {column.required && <span className="text-red-500">*</span>}
                                        {column.helper && (
                                            <Badge variant="secondary" className="text-xs">Helper</Badge>
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                            <TableHead>Status</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((point, index) => {
                            const validation = validationResults[index];
                            const isSelected = selectedRows.has(index);

                            return (
                                <TableRow key={index} data-state={isSelected ? "selected" : undefined}>
                                    <TableCell>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleRowSelection(index)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={point.name || ''}
                                            onChange={(e) => handleCellEdit(index, 'name', e.target.value)}
                                            placeholder="Point name..."
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <SearchableSelect
                                            options={measurementTypeOptions}
                                            value={point.measurement_type_id}
                                            onValueChange={(value) => handleCellEdit(index, 'measurement_type_id', value)}
                                            placeholder="Select type..."
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={point.height_m || ''}
                                            onChange={(e) => handleCellEdit(index, 'height_m', parseFloat(e.target.value))}
                                            placeholder="Height..."
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <SearchableSelect
                                            options={heightReferenceOptions}
                                            value={point.height_reference_id}
                                            onValueChange={(value) => handleCellEdit(index, 'height_reference_id', value)}
                                            placeholder="Reference..."
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={(point as any).unit || ''}
                                            onChange={(e) => handleCellEdit(index, 'unit', e.target.value)}
                                            placeholder="Unit..."
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {validation ? (
                                            validation.isValid ? (
                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Valid
                                                </Badge>
                                            ) : (
                                                <Popover>
                                                    <PopoverTrigger>
                                                        <Badge variant="destructive">
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Invalid
                                                        </Badge>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium text-sm">Validation Errors</h4>
                                                            {validation.errors.map((error, errorIndex) => (
                                                                <div key={errorIndex} className="text-xs text-red-600">
                                                                    {error.message}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )
                                        ) : (
                                            <Badge variant="secondary">Validating...</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleRemovePoint(index)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* CSV Import Dialog */}
            <CSVImportDialog
                isOpen={isCSVImportOpen}
                onClose={() => setIsCSVImportOpen(false)}
                onImport={handleCSVImport}
                locationIndex={locationIndex}
                loggerIdentifier={loggerIdentifier}
            />
        </div>
    );
};