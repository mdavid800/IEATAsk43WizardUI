import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Download, Copy, FileText, AlertCircle, CheckCircle2, Code, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { exportService, type ExportOptions } from '@/services/export-service';
import type { ValidationResult } from '@/services/schema-validator';
import type { IEATask43Schema } from '@/types/schema';

interface ExportPreviewProps {
    data: IEATask43Schema;
    className?: string;
}

interface PreviewData {
    preview: string;
    validation: ValidationResult;
    cleaningInfo: {
        removedFields: string[];
        warnings: string[];
    };
}

export const ExportPreview: React.FC<ExportPreviewProps> = ({
    data,
    className = ''
}) => {
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        includeFormHelperFields: false,
        validateBeforeExport: true,
        formatForReadability: true
    });
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('preview');

    // Generate preview when data or options change
    useEffect(() => {
        generatePreview();
    }, [data, exportOptions]);

    const generatePreview = async () => {
        setIsLoading(true);
        try {
            const result = await exportService.getExportPreview(data, exportOptions);
            setPreviewData(result);
        } catch (error) {
            console.error('Preview generation failed:', error);
            setPreviewData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToClipboard = async () => {
        if (!previewData?.preview) return;
        
        try {
            await navigator.clipboard.writeText(previewData.preview);
            // Could add toast notification here
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    const handleDownload = async () => {
        try {
            await exportService.exportWithOptions(data, 'iea-task43-export.json', exportOptions);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const exportStats = useMemo(() => {
        return exportService.getExportStatistics(data);
    }, [data]);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileSize = (): string => {
        return previewData?.preview ? formatBytes(new Blob([previewData.preview]).size) : '0 Bytes';
    };

    const canExport = previewData?.validation.isValid || 
                     (previewData?.validation && previewData.validation.errors.filter(e => e.severity === 'error').length === 0);

    if (isLoading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Generating export preview...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={className}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Eye className="w-5 h-5" />
                        <div>
                            <div>Export Preview</div>
                            <div className="text-sm font-normal text-muted-foreground">
                                Schema-validated JSON export preview
                            </div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            {previewData?.validation && (
                                <Badge variant={canExport ? "default" : "destructive"}>
                                    {canExport ? (
                                        <>
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Ready
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            Issues
                                        </>
                                    )}
                                </Badge>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Export Options */}
                    <Card className="bg-muted/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Export Options</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="format-readable"
                                    checked={exportOptions.formatForReadability}
                                    onCheckedChange={(checked) => 
                                        setExportOptions(prev => ({ ...prev, formatForReadability: checked }))
                                    }
                                />
                                <Label htmlFor="format-readable">Format for readability (pretty print)</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="include-form-fields"
                                    checked={exportOptions.includeFormHelperFields}
                                    onCheckedChange={(checked) => 
                                        setExportOptions(prev => ({ ...prev, includeFormHelperFields: checked }))
                                    }
                                />
                                <Label htmlFor="include-form-fields">Include form helper fields (not recommended)</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="validate-export"
                                    checked={exportOptions.validateBeforeExport}
                                    onCheckedChange={(checked) => 
                                        setExportOptions(prev => ({ ...prev, validateBeforeExport: checked }))
                                    }
                                />
                                <Label htmlFor="validate-export">Validate before export</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Export Statistics */}
                    <Card className="bg-muted/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Export Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <div className="font-medium">File Size</div>
                                    <div className="text-muted-foreground">{getFileSize()}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Locations</div>
                                    <div className="text-muted-foreground">{exportStats.totalLocations}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Measurements</div>
                                    <div className="text-muted-foreground">{exportStats.totalMeasurementPoints}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Completeness</div>
                                    <div className="text-muted-foreground">{exportStats.dataCompleteness.toFixed(1)}%</div>
                                </div>
                            </div>
                            
                            {Object.keys(exportStats.stationTypes).length > 0 && (
                                <div className="mt-4">
                                    <div className="text-sm font-medium mb-2">Station Types</div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(exportStats.stationTypes).map(([type, count]) => (
                                            <Badge key={type} variant="outline" className="text-xs">
                                                {type}: {count}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Validation Status */}
                    {previewData?.validation && (
                        <Alert variant={canExport ? 'default' : 'destructive'}>
                            {canExport ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertDescription>
                                <div className="space-y-1">
                                    {canExport ? (
                                        <div className="font-medium">Export Ready</div>
                                    ) : (
                                        <div className="font-medium">Export Blocked</div>
                                    )}
                                    <div className="text-sm">
                                        {previewData.validation.errors.filter(e => e.severity === 'error').length} errors, {' '}
                                        {previewData.validation.errors.filter(e => e.severity === 'warning').length + (previewData.validation.warnings?.length || 0)} warnings
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Preview Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="preview">JSON Preview</TabsTrigger>
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                        </TabsList>

                        <TabsContent value="preview" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Code className="w-4 h-4" />
                                    <span className="text-sm font-medium">JSON Output</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsExpanded(!isExpanded)}
                                    >
                                        {isExpanded ? (
                                            <Minimize2 className="w-4 h-4" />
                                        ) : (
                                            <Maximize2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </Button>
                                </div>
                            </div>
                            
                            <Card className="bg-slate-950 text-slate-50">
                                <CardContent className="p-0">
                                    <ScrollArea className={isExpanded ? "h-96" : "h-64"}>
                                        <pre className="p-4 text-xs overflow-x-auto">
                                            <code>{previewData?.preview || 'No preview available'}</code>
                                        </pre>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="summary" className="space-y-4">
                            {previewData?.cleaningInfo && (
                                <div className="space-y-4">
                                    {previewData.cleaningInfo.removedFields.length > 0 && (
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm">Removed Form Fields</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ScrollArea className="h-32">
                                                    <div className="space-y-1 text-sm text-muted-foreground">
                                                        {previewData.cleaningInfo.removedFields.map((field, index) => (
                                                            <div key={index}>• {field}</div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </CardContent>
                                        </Card>
                                    )}
                                    
                                    {previewData.cleaningInfo.warnings.length > 0 && (
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm">Data Cleaning Warnings</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-1 text-sm text-muted-foreground">
                                                    {previewData.cleaningInfo.warnings.map((warning, index) => (
                                                        <div key={index}>• {warning}</div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                            
                            {previewData?.validation && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Validation Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Schema Valid:</span>
                                                <span className={previewData.validation.isValid ? 'text-green-600' : 'text-red-600'}>
                                                    {previewData.validation.isValid ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Critical Errors:</span>
                                                <span className="text-red-600">
                                                    {previewData.validation.errors.filter(e => e.severity === 'error').length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Warnings:</span>
                                                <span className="text-yellow-600">
                                                    {previewData.validation.errors.filter(e => e.severity === 'warning').length + 
                                                     (previewData.validation.warnings?.length || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={handleDownload}
                            disabled={!canExport}
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download JSON
                        </Button>
                        
                        <Button variant="outline" onClick={generatePreview}>
                            <FileText className="w-4 h-4 mr-2" />
                            Refresh Preview
                        </Button>
                    </div>

                    {/* Export Guidelines */}
                    <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <div className="font-medium">Export Preview Guidelines:</div>
                                <ul className="text-sm space-y-1">
                                    <li>• <strong>JSON Preview:</strong> Shows the exact data that will be exported</li>
                                    <li>• <strong>Data Cleaning:</strong> Form-only fields are automatically removed</li>
                                    <li>• <strong>Validation:</strong> Real-time schema compliance checking</li>
                                    <li>• <strong>File Size:</strong> Estimate of the exported JSON file size</li>
                                    <li>• <strong>Export Block:</strong> Critical errors prevent export to ensure schema compliance</li>
                                </ul>
                            </div>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
};