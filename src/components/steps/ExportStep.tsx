import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Download, FileText, AlertCircle, CheckCircle2, Info, ArrowLeft, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportValidationReport } from '@/components/export/ExportValidationReport';
import { ExportPreview } from '@/components/export/ExportPreview';
import { exportService, type ExportOptions } from '@/services/export-service';
import type { ValidationResult } from '@/services/schema-validator';
import type { IEATask43Schema } from '@/types/schema';

interface ExportStepProps {
    onPrevious: () => void;
    onComplete?: () => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({
    onPrevious,
    onComplete
}) => {
    const { watch } = useFormContext<IEATask43Schema>();
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        includeFormHelperFields: false,
        validateBeforeExport: true,
        formatForReadability: true
    });
    const [activeTab, setActiveTab] = useState('validation');
    const [exportStats, setExportStats] = useState<any>(null);

    const formData = watch() as IEATask43Schema;

    // Validate export readiness on component mount and data changes
    useEffect(() => {
        validateExportReadiness();
        updateExportStats();
    }, [formData]);

    const validateExportReadiness = async () => {
        setIsValidating(true);
        try {
            const result = await exportService.validateExportReadiness(formData);
            setValidation(result);
        } catch (error) {
            console.error('Export validation failed:', error);
            setValidation({
                isValid: false,
                errors: [{
                    schemaPath: 'export',
                    dataPath: 'export',
                    message: `Export validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    schemaRule: 'validation',
                    severity: 'error'
                }],
                warnings: []
            });
        } finally {
            setIsValidating(false);
        }
    };

    const updateExportStats = () => {
        const stats = exportService.getExportStatistics(formData);
        setExportStats(stats);
    };

    const handleExport = async () => {
        try {
            await exportService.exportWithOptions(
                formData,
                `iea-task43-${new Date().toISOString().split('T')[0]}.json`,
                exportOptions
            );
            
            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const canExport = validation?.isValid || 
                     (validation && validation.errors.filter(e => e.severity === 'error').length === 0);

    const getValidationSummary = () => {
        if (!validation) {
            return {
                status: 'pending',
                message: 'Validating export readiness...',
                icon: <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            };
        }

        const criticalErrors = validation.errors.filter(e => e.severity === 'error').length;
        const warnings = validation.errors.filter(e => e.severity === 'warning').length + 
                         (validation.warnings?.length || 0);

        if (criticalErrors === 0 && warnings === 0) {
            return {
                status: 'ready',
                message: 'Ready for export - All validation checks passed',
                icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
            };
        } else if (criticalErrors === 0) {
            return {
                status: 'warnings',
                message: `Export ready with ${warnings} warning${warnings !== 1 ? 's' : ''}`,
                icon: <AlertCircle className="w-5 h-5 text-yellow-500" />
            };
        } else {
            return {
                status: 'errors',
                message: `Export blocked by ${criticalErrors} critical error${criticalErrors !== 1 ? 's' : ''}`,
                icon: <AlertCircle className="w-5 h-5 text-red-500" />
            };
        }
    };

    const summary = getValidationSummary();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Download className="w-6 h-6" />
                        Export & Validation
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Validate and export your IEA Task 43 compliant wind measurement dataset
                    </p>
                </div>
                <Badge variant={canExport ? "default" : "destructive"} className="text-sm">
                    {summary.icon}
                    <span className="ml-2">{summary.status.toUpperCase()}</span>
                </Badge>
            </div>

            {/* Export Status Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        {summary.icon}
                        <div>
                            <div>Export Status</div>
                            <div className="text-sm font-normal text-muted-foreground">
                                {summary.message}
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {exportStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex flex-col">
                                <span className="font-medium">Locations</span>
                                <span className="text-2xl font-bold text-primary">{exportStats.totalLocations}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">Measurements</span>
                                <span className="text-2xl font-bold text-primary">{exportStats.totalMeasurementPoints}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">Completeness</span>
                                <span className="text-2xl font-bold text-primary">{exportStats.dataCompleteness.toFixed(0)}%</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">Schema Valid</span>
                                <span className={`text-2xl font-bold ${canExport ? 'text-green-500' : 'text-red-500'}`}>
                                    {canExport ? 'YES' : 'NO'}
                                </span>
                            </div>
                        </div>
                    )}

                    {exportStats && Object.keys(exportStats.stationTypes).length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <div className="text-sm font-medium mb-2">Station Types in Export</div>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(exportStats.stationTypes).map(([type, count]) => (
                                    <Badge key={type} variant="outline">
                                        {type.replace('_', ' ').toUpperCase()}: {count}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="validation" className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Validation Report
                        {validation && !canExport && (
                            <Badge variant="destructive" className="ml-1 text-xs">
                                {validation.errors.filter(e => e.severity === 'error').length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Export Preview
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Export Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="validation" className="space-y-4">
                    {validation ? (
                        <ExportValidationReport
                            data={formData}
                            validation={validation}
                            onRetryValidation={validateExportReadiness}
                        />
                    ) : (
                        <Card>
                            <CardContent className="flex items-center justify-center py-8">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-muted-foreground">Running validation checks...</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                    <ExportPreview data={formData} />
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Export Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">Format for readability</div>
                                        <div className="text-sm text-muted-foreground">
                                            Pretty-print JSON with indentation (recommended for review)
                                        </div>
                                    </div>
                                    <Button
                                        variant={exportOptions.formatForReadability ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setExportOptions(prev => ({
                                            ...prev,
                                            formatForReadability: !prev.formatForReadability
                                        }))}
                                    >
                                        {exportOptions.formatForReadability ? 'Enabled' : 'Disabled'}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">Schema validation</div>
                                        <div className="text-sm text-muted-foreground">
                                            Validate against IEA Task 43 schema before export (strongly recommended)
                                        </div>
                                    </div>
                                    <Button
                                        variant={exportOptions.validateBeforeExport ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setExportOptions(prev => ({
                                            ...prev,
                                            validateBeforeExport: !prev.validateBeforeExport
                                        }))}
                                    >
                                        {exportOptions.validateBeforeExport ? 'Enabled' : 'Disabled'}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">Include form helper fields</div>
                                        <div className="text-sm text-muted-foreground">
                                            Include internal form fields (not recommended for production export)
                                        </div>
                                    </div>
                                    <Button
                                        variant={exportOptions.includeFormHelperFields ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setExportOptions(prev => ({
                                            ...prev,
                                            includeFormHelperFields: !prev.includeFormHelperFields
                                        }))}
                                    >
                                        {exportOptions.includeFormHelperFields ? 'Enabled' : 'Disabled'}
                                    </Button>
                                </div>
                            </div>

                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <div className="font-medium">Export Settings Guidelines:</div>
                                        <ul className="text-sm space-y-1">
                                            <li>• <strong>Readable Format:</strong> Adds indentation and line breaks for human readability</li>
                                            <li>• <strong>Schema Validation:</strong> Ensures 100% compliance with IEA Task 43 standard</li>
                                            <li>• <strong>Form Helper Fields:</strong> Internal fields used by the form interface (excluded by default)</li>
                                            <li>• <strong>Data Cleaning:</strong> Empty values and form-only fields are automatically removed</li>
                                        </ul>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6">
                <Button variant="outline" onClick={onPrevious}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous Step
                </Button>
                
                <div className="text-sm text-muted-foreground">
                    {canExport ? 'Ready to export IEA Task 43 compliant JSON' : 'Resolve validation issues to enable export'}
                </div>
                
                <Button 
                    onClick={handleExport}
                    disabled={!canExport || isValidating}
                    className="flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    {isValidating ? 'Validating...' : 'Export JSON'}
                </Button>
            </div>

            {/* Export Guidelines */}
            <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                    <div className="space-y-2">
                        <div className="font-medium">Final Export Guidelines:</div>
                        <ul className="text-sm space-y-1">
                            <li>• <strong>Schema Compliance:</strong> Exported JSON is fully validated against the official IEA Task 43 schema</li>
                            <li>• <strong>Data Integrity:</strong> All form data is cleaned and optimized for the target schema</li>
                            <li>• <strong>Quality Assurance:</strong> Critical errors block export to ensure data quality</li>
                            <li>• <strong>Standard Format:</strong> Output follows the exact structure required by IEA Task 43</li>
                            <li>• <strong>Metadata Preservation:</strong> All essential measurement metadata and relationships are maintained</li>
                        </ul>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    );
};