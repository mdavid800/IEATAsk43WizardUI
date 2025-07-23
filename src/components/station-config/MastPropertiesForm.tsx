import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Plus, Trash2, Tower, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { schemaValidator, type ValidationResult } from '@/services/schema-validator';
import type { 
    IEATask43Schema, 
    MastProperties, 
    MastSectionGeometry,
    MastGeometryId 
} from '@/types/schema';

interface MastPropertiesFormProps {
    locationIndex: number;
}

const mastGeometryOptions = [
    { value: 'lattice_triangle', label: 'Lattice Triangle' },
    { value: 'lattice_square_round_edges', label: 'Lattice Square (Round Edges)' },
    { value: 'lattice_square_sharp_edges', label: 'Lattice Square (Sharp Edges)' },
    { value: 'pole', label: 'Pole' }
];

export const MastPropertiesForm: React.FC<MastPropertiesFormProps> = ({
    locationIndex
}) => {
    const { register, setValue, watch } = useFormContext<IEATask43Schema>();
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    
    const mastProperties = watch(`measurement_location.${locationIndex}.mast_properties`) as MastProperties | undefined;
    const locationName = watch(`measurement_location.${locationIndex}.name`) || `Location ${locationIndex + 1}`;

    // Initialize mast properties if not present
    useEffect(() => {
        if (!mastProperties) {
            const now = new Date().toISOString();
            const defaultMastProperties: MastProperties = {
                mast_geometry_id: null,
                mast_oem: '',
                mast_serial_number: '',
                mast_model: '',
                mast_height_m: 0,
                date_from: now,
                date_to: null,
                notes: '',
                update_at: now,
                mast_section_geometry: []
            };
            setValue(`measurement_location.${locationIndex}.mast_properties`, defaultMastProperties);
        }
    }, [mastProperties, setValue, locationIndex]);

    // Validate mast properties
    useEffect(() => {
        if (mastProperties) {
            const validateData = async () => {
                try {
                    // Note: Since mast_properties might not have a direct schema path,
                    // we'll validate the essential fields manually
                    const errors = [];
                    
                    if (!mastProperties.mast_height_m || mastProperties.mast_height_m <= 0) {
                        errors.push({
                            schemaPath: 'mast_properties.mast_height_m',
                            dataPath: 'mast_height_m',
                            message: 'Mast height must be greater than 0',
                            schemaRule: 'minimum',
                            severity: 'error' as const
                        });
                    }

                    if (!mastProperties.date_from) {
                        errors.push({
                            schemaPath: 'mast_properties.date_from',
                            dataPath: 'date_from',
                            message: 'Date from is required',
                            schemaRule: 'required',
                            severity: 'error' as const
                        });
                    }

                    setValidation({
                        isValid: errors.length === 0,
                        errors,
                        warnings: []
                    });
                } catch (error) {
                    setValidation({
                        isValid: false,
                        errors: [{
                            schemaPath: 'mast_properties',
                            dataPath: 'mast_properties',
                            message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            schemaRule: 'validation',
                            severity: 'error' as const
                        }],
                        warnings: []
                    });
                }
            };
            validateData();
        }
    }, [mastProperties]);

    const addSectionGeometry = () => {
        if (!mastProperties) return;

        const now = new Date().toISOString();
        const newSection: MastSectionGeometry = {
            uuid: crypto.randomUUID(),
            mast_section_height_mm: null,
            pole_diameter_mm: null,
            lattice_face_width_at_bottom_mm: null,
            lattice_face_width_at_top_mm: null,
            lattice_leg_width_mm: null,
            lattice_leg_is_round_cross_section: null,
            lattice_bracing_member_diameter_mm: null,
            lattice_bracing_member_diameter_horizontal_mm: null,
            lattice_bracing_member_diameter_diagonal_mm: null,
            lattice_number_of_diagonal_bracing_members: null,
            lattice_bracing_member_length_diagonal_mm: null,
            number_of_repetitive_patterns_on_face: null,
            lattice_bracing_member_height_mm: null,
            lattice_has_horizontal_member: null,
            notes: null,
            update_at: now
        };

        const updatedSections = [...(mastProperties.mast_section_geometry || []), newSection];
        setValue(`measurement_location.${locationIndex}.mast_properties.mast_section_geometry`, updatedSections);
    };

    const removeSectionGeometry = (sectionIndex: number) => {
        if (!mastProperties?.mast_section_geometry) return;

        const updatedSections = mastProperties.mast_section_geometry.filter((_, index) => index !== sectionIndex);
        setValue(`measurement_location.${locationIndex}.mast_properties.mast_section_geometry`, updatedSections);
    };

    const updateField = (field: string, value: any) => {
        setValue(`measurement_location.${locationIndex}.mast_properties.${field}`, value);
        setValue(`measurement_location.${locationIndex}.mast_properties.update_at`, new Date().toISOString());
    };

    if (!mastProperties) {
        return null; // Will be initialized by useEffect
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Tower className="w-5 h-5" />
                    <div>
                        <div>Mast Properties</div>
                        <div className="text-sm font-normal text-muted-foreground">
                            Physical mast configuration for {locationName}
                        </div>
                    </div>
                    <div className="ml-auto">
                        {validation && (
                            <Badge variant={validation.isValid ? "default" : "destructive"}>
                                {validation.isValid ? (
                                    <>
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Valid
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Invalid
                                    </>
                                )}
                            </Badge>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Validation Errors */}
                {validation && !validation.isValid && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-1">
                                {validation.errors.map((error, index) => (
                                    <div key={index} className="text-sm">• {error.message}</div>
                                ))}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Basic Mast Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor={`mast-geometry-${locationIndex}`}>
                            Mast Geometry Type
                        </Label>
                        <SearchableSelect
                            options={mastGeometryOptions}
                            value={mastProperties.mast_geometry_id || undefined}
                            onValueChange={(value) => updateField('mast_geometry_id', value as MastGeometryId)}
                            placeholder="Select geometry type..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`mast-height-${locationIndex}`}>
                            Mast Height (m) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`mast-height-${locationIndex}`}
                            type="number"
                            step="0.1"
                            min="0"
                            value={mastProperties.mast_height_m || ''}
                            onChange={(e) => updateField('mast_height_m', parseFloat(e.target.value) || 0)}
                            placeholder="Enter mast height..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`mast-oem-${locationIndex}`}>
                            Mast OEM/Manufacturer
                        </Label>
                        <Input
                            id={`mast-oem-${locationIndex}`}
                            value={mastProperties.mast_oem || ''}
                            onChange={(e) => updateField('mast_oem', e.target.value)}
                            placeholder="Enter manufacturer..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`mast-model-${locationIndex}`}>
                            Mast Model
                        </Label>
                        <Input
                            id={`mast-model-${locationIndex}`}
                            value={mastProperties.mast_model || ''}
                            onChange={(e) => updateField('mast_model', e.target.value)}
                            placeholder="Enter model..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`mast-serial-${locationIndex}`}>
                            Mast Serial Number
                        </Label>
                        <Input
                            id={`mast-serial-${locationIndex}`}
                            value={mastProperties.mast_serial_number || ''}
                            onChange={(e) => updateField('mast_serial_number', e.target.value)}
                            placeholder="Enter serial number..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`mast-date-from-${locationIndex}`}>
                            Date From <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`mast-date-from-${locationIndex}`}
                            type="datetime-local"
                            value={mastProperties.date_from ? mastProperties.date_from.slice(0, 16) : ''}
                            onChange={(e) => updateField('date_from', e.target.value ? new Date(e.target.value).toISOString() : '')}
                        />
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label htmlFor={`mast-notes-${locationIndex}`}>
                        Notes
                    </Label>
                    <Textarea
                        id={`mast-notes-${locationIndex}`}
                        value={mastProperties.notes || ''}
                        onChange={(e) => updateField('notes', e.target.value)}
                        placeholder="Enter any additional notes about the mast..."
                        rows={3}
                    />
                </div>

                {/* Mast Section Geometry */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">Mast Section Geometry</h4>
                            <p className="text-sm text-muted-foreground">
                                Define the geometric properties of mast sections
                            </p>
                        </div>
                        <Button onClick={addSectionGeometry} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Section
                        </Button>
                    </div>

                    {mastProperties.mast_section_geometry && mastProperties.mast_section_geometry.length > 0 ? (
                        <div className="space-y-4">
                            {mastProperties.mast_section_geometry.map((section, sectionIndex) => (
                                <Card key={section.uuid || sectionIndex} className="bg-muted/20">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm">
                                                Section {sectionIndex + 1}
                                            </CardTitle>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeSectionGeometry(sectionIndex)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Section Height (mm)</Label>
                                                <Input
                                                    type="number"
                                                    value={section.mast_section_height_mm || ''}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value) || null;
                                                        setValue(
                                                            `measurement_location.${locationIndex}.mast_properties.mast_section_geometry.${sectionIndex}.mast_section_height_mm`,
                                                            value
                                                        );
                                                    }}
                                                    placeholder="Height in mm..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Pole Diameter (mm)</Label>
                                                <Input
                                                    type="number"
                                                    value={section.pole_diameter_mm || ''}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value) || null;
                                                        setValue(
                                                            `measurement_location.${locationIndex}.mast_properties.mast_section_geometry.${sectionIndex}.pole_diameter_mm`,
                                                            value
                                                        );
                                                    }}
                                                    placeholder="Diameter in mm..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Face Width at Bottom (mm)</Label>
                                                <Input
                                                    type="number"
                                                    value={section.lattice_face_width_at_bottom_mm || ''}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value) || null;
                                                        setValue(
                                                            `measurement_location.${locationIndex}.mast_properties.mast_section_geometry.${sectionIndex}.lattice_face_width_at_bottom_mm`,
                                                            value
                                                        );
                                                    }}
                                                    placeholder="Width in mm..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Face Width at Top (mm)</Label>
                                                <Input
                                                    type="number"
                                                    value={section.lattice_face_width_at_top_mm || ''}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value) || null;
                                                        setValue(
                                                            `measurement_location.${locationIndex}.mast_properties.mast_section_geometry.${sectionIndex}.lattice_face_width_at_top_mm`,
                                                            value
                                                        );
                                                    }}
                                                    placeholder="Width in mm..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Leg Width (mm)</Label>
                                                <Input
                                                    type="number"
                                                    value={section.lattice_leg_width_mm || ''}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value) || null;
                                                        setValue(
                                                            `measurement_location.${locationIndex}.mast_properties.mast_section_geometry.${sectionIndex}.lattice_leg_width_mm`,
                                                            value
                                                        );
                                                    }}
                                                    placeholder="Width in mm..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Bracing Member Diameter (mm)</Label>
                                                <Input
                                                    type="number"
                                                    value={section.lattice_bracing_member_diameter_mm || ''}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value) || null;
                                                        setValue(
                                                            `measurement_location.${locationIndex}.mast_properties.mast_section_geometry.${sectionIndex}.lattice_bracing_member_diameter_mm`,
                                                            value
                                                        );
                                                    }}
                                                    placeholder="Diameter in mm..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`round-cross-section-${locationIndex}-${sectionIndex}`}
                                                checked={section.lattice_leg_is_round_cross_section || false}
                                                onCheckedChange={(checked) => {
                                                    setValue(
                                                        `measurement_location.${locationIndex}.mast_properties.mast_section_geometry.${sectionIndex}.lattice_leg_is_round_cross_section`,
                                                        checked as boolean
                                                    );
                                                }}
                                            />
                                            <Label htmlFor={`round-cross-section-${locationIndex}-${sectionIndex}`}>
                                                Lattice leg has round cross section
                                            </Label>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Section Notes</Label>
                                            <Textarea
                                                value={section.notes || ''}
                                                onChange={(e) => {
                                                    setValue(
                                                        `measurement_location.${locationIndex}.mast_properties.mast_section_geometry.${sectionIndex}.notes`,
                                                        e.target.value || null
                                                    );
                                                }}
                                                placeholder="Notes about this section..."
                                                rows={2}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground">
                            <Tower className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No mast sections defined</p>
                            <p className="text-sm">Add sections to define the mast geometry</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};