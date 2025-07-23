import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronRight, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ValidationResult, ValidationError } from '@/services/schema-validator';
import type { IEATask43Schema } from '@/types/schema';

interface ExportValidationReportProps {
    data: IEATask43Schema;
    validation: ValidationResult;
    cleaningInfo?: {
        removedFields: string[];
        warnings: string[];
    };
    onRetryValidation?: () => void;
    className?: string;
}

interface GroupedErrors {
    critical: ValidationError[];
    warnings: ValidationError[];
    info: ValidationError[];
}

interface ErrorsBySection {
    [section: string]: ValidationError[];
}

export const ExportValidationReport: React.FC<ExportValidationReportProps> = ({
    data,
    validation,
    cleaningInfo,
    onRetryValidation,
    className = ''
}) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [groupedErrors, setGroupedErrors] = useState<GroupedErrors>({
        critical: [],
        warnings: [],
        info: []
    });
    const [errorsBySection, setErrorsBySection] = useState<ErrorsBySection>({});

    useEffect(() => {
        // Group errors by severity
        const grouped: GroupedErrors = {
            critical: validation.errors.filter(error => error.severity === 'error'),
            warnings: validation.errors.filter(error => error.severity === 'warning').concat(
                validation.warnings || []
            ),
            info: validation.errors.filter(error => error.severity === 'info')
        };
        setGroupedErrors(grouped);

        // Group errors by data section
        const bySection: ErrorsBySection = {};
        [...grouped.critical, ...grouped.warnings, ...grouped.info].forEach(error => {
            const section = getErrorSection(error.schemaPath);
            if (!bySection[section]) {
                bySection[section] = [];
            }
            bySection[section].push(error);
        });
        setErrorsBySection(bySection);

        // Auto-expand sections with critical errors
        const criticalSections = new Set<string>();
        grouped.critical.forEach(error => {
            criticalSections.add(getErrorSection(error.schemaPath));
        });
        setExpandedSections(criticalSections);
    }, [validation]);

    const getErrorSection = (schemaPath: string): string => {
        const parts = schemaPath.split('.');
        if (parts.length === 0) return 'General';
        
        const sectionMap: Record<string, string> = {
            'author': 'Basic Information',
            'organisation': 'Basic Information',
            'plant_type': 'Basic Information',
            'measurement_location': 'Measurement Locations',
            'measurement_point': 'Measurement Points',
            'mast_properties': 'Station Configuration',
            'vertical_profiler_properties': 'Station Configuration',
            'model_config': 'Station Configuration',
            'logger_main_config': 'Logger Configuration',
            'sensors': 'Sensor Management'
        };

        for (const key in sectionMap) {
            if (schemaPath.includes(key)) {
                return sectionMap[key];
            }
        }
        
        return 'Other';
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default:
                return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const getSeverityBadge = (severity: string, count: number) => {
        const variants = {
            error: 'destructive' as const,
            warning: 'secondary' as const,
            info: 'outline' as const
        };
        
        return (
            <Badge variant={variants[severity as keyof typeof variants] || 'outline'}>
                {count} {severity === 'error' ? 'Error' : severity === 'warning' ? 'Warning' : 'Info'}{count !== 1 ? 's' : ''}
            </Badge>
        );
    };

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const getValidationSummary = () => {
        const totalErrors = groupedErrors.critical.length;
        const totalWarnings = groupedErrors.warnings.length;
        const totalInfo = groupedErrors.info.length;
        
        if (totalErrors === 0 && totalWarnings === 0 && totalInfo === 0) {
            return {
                status: 'valid',
                message: 'All validation checks passed successfully',
                icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
            };
        } else if (totalErrors === 0) {
            return {
                status: 'warnings',
                message: `Export ready with ${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''}`,
                icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />
            };
        } else {
            return {
                status: 'errors',
                message: `Export blocked by ${totalErrors} critical error${totalErrors !== 1 ? 's' : ''}`,
                icon: <AlertCircle className="w-5 h-5 text-red-500" />
            };
        }
    };

    const summary = getValidationSummary();
    const canExport = groupedErrors.critical.length === 0;

    return (
        <div className={className}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        {summary.icon}
                        <div>
                            <div>Export Validation Report</div>
                            <div className="text-sm font-normal text-muted-foreground">
                                {summary.message}
                            </div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            {groupedErrors.critical.length > 0 && getSeverityBadge('error', groupedErrors.critical.length)}
                            {groupedErrors.warnings.length > 0 && getSeverityBadge('warning', groupedErrors.warnings.length)}
                            {groupedErrors.info.length > 0 && getSeverityBadge('info', groupedErrors.info.length)}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Overall Status */}
                    <Alert variant={summary.status === 'errors' ? 'destructive' : summary.status === 'warnings' ? 'default' : 'default'}>
                        {summary.icon}
                        <AlertDescription>
                            <div className="space-y-2">
                                <div className="font-medium">{summary.message}</div>
                                {!canExport && (
                                    <div className="text-sm">
                                        Please resolve all critical errors before exporting. The data must be 100% compliant with the IEA Task 43 schema.
                                    </div>
                                )}
                                {canExport && groupedErrors.warnings.length > 0 && (
                                    <div className="text-sm">
                                        Export is allowed but warnings should be reviewed for data quality.
                                    </div>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* Data Cleaning Information */}
                    {cleaningInfo && (cleaningInfo.removedFields.length > 0 || cleaningInfo.warnings.length > 0) && (
                        <Card className="bg-muted/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Data Cleaning Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {cleaningInfo.removedFields.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium mb-2">
                                            Removed Form-Only Fields ({cleaningInfo.removedFields.length})
                                        </div>
                                        <ScrollArea className="h-20">
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                {cleaningInfo.removedFields.map((field, index) => (
                                                    <div key={index}>• {field}</div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                                {cleaningInfo.warnings.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium mb-2">
                                            Cleaning Warnings ({cleaningInfo.warnings.length})
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            {cleaningInfo.warnings.map((warning, index) => (
                                                <div key={index}>• {warning}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Validation Issues by Section */}
                    {Object.keys(errorsBySection).length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium">Validation Issues by Section</h4>
                            {Object.entries(errorsBySection).map(([section, errors]) => (
                                <Collapsible
                                    key={section}
                                    open={expandedSections.has(section)}
                                    onOpenChange={() => toggleSection(section)}
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                {section}
                                                <div className="flex items-center gap-1">
                                                    {errors.filter(e => e.severity === 'error').length > 0 && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            {errors.filter(e => e.severity === 'error').length}
                                                        </Badge>
                                                    )}
                                                    {errors.filter(e => e.severity === 'warning').length > 0 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {errors.filter(e => e.severity === 'warning').length}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {expandedSections.has(section) ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2">
                                        <Card className="bg-muted/10">
                                            <CardContent className="pt-4">
                                                <ScrollArea className="h-48">
                                                    <div className="space-y-3">
                                                        {errors.map((error, index) => (
                                                            <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-md">
                                                                {getSeverityIcon(error.severity)}
                                                                <div className="flex-1 space-y-1">
                                                                    <div className="text-sm font-medium">
                                                                        {error.message}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        Path: {error.dataPath || error.schemaPath}
                                                                    </div>
                                                                    {error.schemaRule && (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            Rule: {error.schemaRule}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </CardContent>
                                        </Card>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {onRetryValidation && (
                            <Button variant="outline" onClick={onRetryValidation}>
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Retry Validation
                            </Button>
                        )}
                        
                        {Object.keys(errorsBySection).length === 0 && (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Ready for Export</span>
                            </div>
                        )}
                    </div>

                    {/* Export Guidelines */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <div className="font-medium">Export Validation Guidelines:</div>
                                <ul className="text-sm space-y-1">
                                    <li>• <strong>Critical Errors:</strong> Must be resolved before export - these violate required schema constraints</li>
                                    <li>• <strong>Warnings:</strong> Should be reviewed but don't block export - may affect data quality</li>
                                    <li>• <strong>Info:</strong> Informational messages about data structure or recommendations</li>
                                    <li>• <strong>Form Fields:</strong> Removed automatically during export to ensure schema compliance</li>
                                    <li>• <strong>Empty Values:</strong> Cleaned automatically (empty strings, null arrays, empty objects)</li>
                                </ul>
                            </div>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
};