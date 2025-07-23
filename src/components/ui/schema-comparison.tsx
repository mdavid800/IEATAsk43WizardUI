import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { IEATask43Schema } from '../../types/schema';

interface SchemaNode {
  name: string;
  type: string;
  required: boolean;
  isArray?: boolean;
  children?: SchemaNode[];
  value?: any;
  hasValue?: boolean;
  isCompliant?: boolean;
  path: string;
  description?: string;
  enum?: string[];
  constraints?: string;
}

interface SchemaComparisonProps {
  data: IEATask43Schema;
  validationErrors?: Array<{ path: string; message: string }>;
  className?: string;
}

export function SchemaComparison({ data, validationErrors = [], className }: SchemaComparisonProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root', 'measurement_location', 'measurement_location[0]']));

  // Build schema structure with actual data comparison
  const schemaStructure = useMemo((): SchemaNode => {
    const hasValidationError = (path: string) => validationErrors.some(err => err.path.includes(path));
    const getValidationError = (path: string) => validationErrors.find(err => err.path.includes(path))?.message;

    // Helper to get value from nested path
    const getValueAtPath = (obj: any, path: string): any => {
      if (!path || path === 'root') return obj;
      
      const parts = path.split('.');
      let current = obj;
      
      for (const part of parts) {
        if (part.includes('[') && part.includes(']')) {
          const [arrayName, indexStr] = part.split('[');
          const index = parseInt(indexStr.replace(']', ''));
          current = current?.[arrayName]?.[index];
        } else {
          current = current?.[part];
        }
        
        if (current === undefined || current === null) break;
      }
      
      return current;
    };

    const hasValue = (value: any): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    };

    const buildNode = (name: string, path: string, required: boolean, type: string, isArray: boolean = false, description?: string, enumValues?: string[], constraints?: string): SchemaNode => {
      const value = getValueAtPath(data, path);
      const nodeHasValue = hasValue(value);
      const hasError = hasValidationError(path);
      
      let isCompliant = true;
      if (required && !nodeHasValue) isCompliant = false;
      if (hasError) isCompliant = false;

      return {
        name,
        type,
        required,
        isArray,
        value,
        hasValue: nodeHasValue,
        isCompliant,
        path,
        description,
        enum: enumValues,
        constraints
      };
    };

    const root: SchemaNode = {
      name: 'root',
      type: 'object',
      required: true,
      path: 'root',
      hasValue: true,
      isCompliant: true,
      children: [
        buildNode('author', 'author', true, 'string', false, 'Person who created this JSON file'),
        buildNode('organisation', 'organisation', true, 'string', false, 'Organisation responsible for the measurement campaign'),
        buildNode('date', 'date', true, 'date', false, 'Date this JSON file was created (YYYY-MM-DD)'),
        buildNode('version', 'version', true, 'string', false, 'Schema version', undefined, 'Pattern: \\d+\\.\\d+\\.\\d+-\\d{4}\\.\\d{2}'),
        buildNode('license', 'license', false, 'string|null', false, 'Legal document or URI giving permission to use this data'),
        buildNode('plant_name', 'plant_name', false, 'string|null', false, 'Name of the renewable energy plant'),
        buildNode('plant_type', 'plant_type', false, 'enum|null', false, 'Type of renewable energy plant', ['onshore_wind', 'offshore_wind', 'solar']),
        {
          ...buildNode('measurement_location', 'measurement_location', true, 'array', true, 'Array of measurement locations'),
          children: data.measurement_location?.map((location, index) => ({
            name: `[${index}] ${location.name || 'Location'}`,
            type: 'object',
            required: true,
            isArray: false,
            path: `measurement_location[${index}]`,
            hasValue: true,
            isCompliant: !hasValidationError(`measurement_location[${index}]`),
            children: [
              buildNode('uuid', `measurement_location[${index}].uuid`, false, 'uuid|null', false, 'Unique identifier for this location'),
              buildNode('name', `measurement_location[${index}].name`, true, 'string', false, 'Name of the measurement location'),
              buildNode('latitude_ddeg', `measurement_location[${index}].latitude_ddeg`, true, 'number', false, 'Latitude in decimal degrees', undefined, '-90 to 90'),
              buildNode('longitude_ddeg', `measurement_location[${index}].longitude_ddeg`, true, 'number', false, 'Longitude in decimal degrees', undefined, '-180 to 180'),
              buildNode('measurement_station_type_id', `measurement_location[${index}].measurement_station_type_id`, true, 'enum', false, 'Type of measurement station', ['mast', 'lidar', 'sodar', 'floating_lidar', 'wave_buoy', 'adcp', 'solar', 'virtual_met_mast', 'reanalysis']),
              buildNode('notes', `measurement_location[${index}].notes`, false, 'string|null', false, 'Additional notes about this location'),
              buildNode('update_at', `measurement_location[${index}].update_at`, false, 'datetime|null', false, 'Last update timestamp'),
              
              // Conditional sections based on station type
              ...(location.measurement_station_type_id === 'mast' && location.mast_properties ? [{
                ...buildNode('mast_properties', `measurement_location[${index}].mast_properties`, false, 'object|null', false, 'Properties specific to met masts'),
                children: [
                  buildNode('mast_height_m', `measurement_location[${index}].mast_properties.mast_height_m`, false, 'number|null', false, 'Height of the mast in meters'),
                  buildNode('mast_oem', `measurement_location[${index}].mast_properties.mast_oem`, false, 'string|null', false, 'Original Equipment Manufacturer'),
                  buildNode('mast_model', `measurement_location[${index}].mast_properties.mast_model`, false, 'string|null', false, 'Model name of the mast'),
                  buildNode('date_from', `measurement_location[${index}].mast_properties.date_from`, true, 'datetime', false, 'Start date for these properties'),
                  buildNode('date_to', `measurement_location[${index}].mast_properties.date_to`, false, 'datetime|null', false, 'End date for these properties'),
                ]
              }] : []),

              ...(location.vertical_profiler_properties && location.vertical_profiler_properties.length > 0 ? [{
                ...buildNode('vertical_profiler_properties', `measurement_location[${index}].vertical_profiler_properties`, false, 'array|null', true, 'Properties for lidar/sodar devices'),
                children: location.vertical_profiler_properties.map((_, vpIndex) => ({
                  name: `[${vpIndex}] Profiler Config`,
                  type: 'object',
                  required: false,
                  isArray: false,
                  path: `measurement_location[${index}].vertical_profiler_properties[${vpIndex}]`,
                  hasValue: true,
                  isCompliant: true,
                  children: [
                    buildNode('device_datum_plane_height_m', `measurement_location[${index}].vertical_profiler_properties[${vpIndex}].device_datum_plane_height_m`, false, 'number|null', false, 'Height of device datum plane'),
                    buildNode('height_reference_id', `measurement_location[${index}].vertical_profiler_properties[${vpIndex}].height_reference_id`, false, 'enum|null', false, 'Reference for height measurements', ['ground_level', 'mean_sea_level', 'sea_level', 'lowest_astronomical_tide', 'sea_floor', 'other']),
                    buildNode('date_from', `measurement_location[${index}].vertical_profiler_properties[${vpIndex}].date_from`, true, 'datetime', false, 'Start date for this configuration'),
                    buildNode('date_to', `measurement_location[${index}].vertical_profiler_properties[${vpIndex}].date_to`, false, 'datetime|null', false, 'End date for this configuration'),
                  ]
                }))
              }] : []),

              {
                ...buildNode('logger_main_config', `measurement_location[${index}].logger_main_config`, false, 'array|null', true, 'Logger configuration details'),
                children: location.logger_main_config?.map((logger, loggerIndex) => ({
                  name: `[${loggerIndex}] ${logger.logger_name || logger.logger_serial_number || 'Logger'}`,
                  type: 'object',
                  required: false,
                  isArray: false,
                  path: `measurement_location[${index}].logger_main_config[${loggerIndex}]`,
                  hasValue: true,
                  isCompliant: !hasValidationError(`measurement_location[${index}].logger_main_config[${loggerIndex}]`),
                  children: [
                    buildNode('logger_oem_id', `measurement_location[${index}].logger_main_config[${loggerIndex}].logger_oem_id`, true, 'enum', false, 'Logger manufacturer', ['NRG Systems', 'Ammonit', 'Campbell Scientific', 'Vaisala', 'Other']),
                    buildNode('logger_serial_number', `measurement_location[${index}].logger_main_config[${loggerIndex}].logger_serial_number`, true, 'string', false, 'Unique serial number'),
                    buildNode('date_from', `measurement_location[${index}].logger_main_config[${loggerIndex}].date_from`, true, 'datetime', false, 'Logger deployment start date'),
                    buildNode('date_to', `measurement_location[${index}].logger_main_config[${loggerIndex}].date_to`, true, 'datetime|null', false, 'Logger deployment end date'),
                  ]
                })) || []
              },

              {
                ...buildNode('measurement_point', `measurement_location[${index}].measurement_point`, true, 'array', true, 'Array of measurement points'),
                children: location.measurement_point?.slice(0, 3).map((point, pointIndex) => ({
                  name: `[${pointIndex}] ${point.name || 'Point'}`,
                  type: 'object',
                  required: true,
                  isArray: false,
                  path: `measurement_location[${index}].measurement_point[${pointIndex}]`,
                  hasValue: true,
                  isCompliant: !hasValidationError(`measurement_location[${index}].measurement_point[${pointIndex}]`),
                  children: [
                    buildNode('name', `measurement_location[${index}].measurement_point[${pointIndex}].name`, true, 'string', false, 'Name of the measurement point'),
                    buildNode('measurement_type_id', `measurement_location[${index}].measurement_point[${pointIndex}].measurement_type_id`, true, 'enum', false, 'Type of measurement', ['wind_speed', 'wind_direction', 'temperature', 'pressure', 'wave_height']),
                    buildNode('height_m', `measurement_location[${index}].measurement_point[${pointIndex}].height_m`, true, 'number|null', false, 'Height of measurement point'),
                    buildNode('height_reference_id', `measurement_location[${index}].measurement_point[${pointIndex}].height_reference_id`, true, 'enum', false, 'Reference for height measurement', ['ground_level', 'mean_sea_level', 'sea_level']),
                    {
                      ...buildNode('logger_measurement_config', `measurement_location[${index}].measurement_point[${pointIndex}].logger_measurement_config`, true, 'array', true, 'Logger configuration for this measurement'),
                      children: point.logger_measurement_config?.slice(0, 1).map((config, configIndex) => ({
                        name: `[${configIndex}] Config`,
                        type: 'object',
                        required: true,
                        isArray: false,
                        path: `measurement_location[${index}].measurement_point[${pointIndex}].logger_measurement_config[${configIndex}]`,
                        hasValue: true,
                        isCompliant: true,
                        children: [
                          buildNode('date_from', `measurement_location[${index}].measurement_point[${pointIndex}].logger_measurement_config[${configIndex}].date_from`, true, 'datetime', false, 'Configuration start date'),
                          buildNode('date_to', `measurement_location[${index}].measurement_point[${pointIndex}].logger_measurement_config[${configIndex}].date_to`, true, 'datetime|null', false, 'Configuration end date'),
                          {
                            ...buildNode('column_name', `measurement_location[${index}].measurement_point[${pointIndex}].logger_measurement_config[${configIndex}].column_name`, true, 'array', true, 'Column names in data file'),
                            children: config.column_name?.slice(0, 1).map((col, colIndex) => ({
                              name: `[${colIndex}] "${col.column_name}"`,
                              type: 'object',
                              required: true,
                              isArray: false,
                              path: `measurement_location[${index}].measurement_point[${pointIndex}].logger_measurement_config[${configIndex}].column_name[${colIndex}]`,
                              hasValue: true,
                              isCompliant: true,
                              children: [
                                buildNode('column_name', `measurement_location[${index}].measurement_point[${pointIndex}].logger_measurement_config[${configIndex}].column_name[${colIndex}].column_name`, true, 'string', false, 'Exact column name from data file'),
                                buildNode('statistic_type_id', `measurement_location[${index}].measurement_point[${pointIndex}].logger_measurement_config[${configIndex}].column_name[${colIndex}].statistic_type_id`, true, 'enum', false, 'Type of statistic', ['avg', 'sd', 'max', 'min', 'ti']),
                                buildNode('is_ignored', `measurement_location[${index}].measurement_point[${pointIndex}].logger_measurement_config[${configIndex}].column_name[${colIndex}].is_ignored`, true, 'boolean', false, 'Whether this column should be ignored'),
                              ]
                            })) || []
                          }
                        ]
                      })) || []
                    },
                    {
                      ...buildNode('sensor', `measurement_location[${index}].measurement_point[${pointIndex}].sensor`, true, 'array', true, 'Sensors for this measurement point'),
                      children: point.sensor?.slice(0, 1).map((sensor, sensorIndex) => ({
                        name: `[${sensorIndex}] ${sensor.model || 'Sensor'}`,
                        type: 'object',
                        required: true,
                        isArray: false,
                        path: `measurement_location[${index}].measurement_point[${pointIndex}].sensor[${sensorIndex}]`,
                        hasValue: true,
                        isCompliant: true,
                        children: [
                          buildNode('oem', `measurement_location[${index}].measurement_point[${pointIndex}].sensor[${sensorIndex}].oem`, false, 'string|null', false, 'Original Equipment Manufacturer'),
                          buildNode('model', `measurement_location[${index}].measurement_point[${pointIndex}].sensor[${sensorIndex}].model`, false, 'string|null', false, 'Sensor model name'),
                          buildNode('serial_number', `measurement_location[${index}].measurement_point[${pointIndex}].sensor[${sensorIndex}].serial_number`, false, 'string|null', false, 'Unique serial number'),
                          buildNode('sensor_type_id', `measurement_location[${index}].measurement_point[${pointIndex}].sensor[${sensorIndex}].sensor_type_id`, false, 'enum|null', false, 'Type of sensor', ['anemometer', 'wind_vane', 'thermometer', 'lidar']),
                          buildNode('date_from', `measurement_location[${index}].measurement_point[${pointIndex}].sensor[${sensorIndex}].date_from`, true, 'datetime', false, 'Sensor deployment start date'),
                          buildNode('date_to', `measurement_location[${index}].measurement_point[${pointIndex}].sensor[${sensorIndex}].date_to`, true, 'datetime|null', false, 'Sensor deployment end date'),
                        ]
                      })) || []
                    }
                  ]
                })) || []
              }
            ]
          })) || []
        }
      ]
    };

    return root;
  }, [data, validationErrors]);

  const toggleNode = (path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderNode = (node: SchemaNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    const indentClass = `ml-${Math.min(level * 4, 20)}`;

    const getStatusIcon = () => {
      if (!node.isCompliant) {
        return <XCircle className="w-4 h-4 text-red-500" />;
      }
      if (node.required && !node.hasValue) {
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      }
      if (node.hasValue) {
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      }
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    };

    const formatValue = (value: any): string => {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (Array.isArray(value)) return `[${value.length} item${value.length !== 1 ? 's' : ''}]`;
      if (typeof value === 'object') return '{object}';
      if (typeof value === 'string') return `"${value}"`;
      return String(value);
    };

    return (
      <div key={node.path} className={`${level > 0 ? indentClass : ''}`}>
        <div className="flex items-center gap-2 py-1 hover:bg-muted/30 rounded transition-colors">
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.path)}
              className="flex-shrink-0 p-1 hover:bg-muted rounded text-muted-foreground"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <div className="flex-shrink-0">{getStatusIcon()}</div>
          
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={cn(
              "font-mono text-sm",
              node.required ? "text-red-700 font-semibold" : "text-gray-600"
            )}>
              {node.name}
              {node.isArray && <span className="text-orange-600 font-bold">[]</span>}
            </span>
            
            <span className="text-blue-600 text-xs italic font-mono">
              {node.type}
            </span>

            {node.hasValue && (
              <span className="text-green-700 text-xs font-mono truncate">
                = {formatValue(node.value)}
              </span>
            )}

            {node.enum && (
              <span className="text-purple-600 text-xs">
                ({node.enum.slice(0, 3).join('|')}{node.enum.length > 3 ? '...' : ''})
              </span>
            )}

            {node.constraints && (
              <span className="text-orange-600 text-xs">
                {node.constraints}
              </span>
            )}
          </div>

          {node.description && (
            <div className="flex-shrink-0">
              <div className="group relative">
                <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                <div className="absolute right-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  {node.description}
                </div>
              </div>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-2">
            {node.children!.map(child => renderNode(child, level + 1))}
            {node.isArray && node.children!.length > 3 && (
              <div className={`${indentClass} text-sm text-muted-foreground italic py-1`}>
                ... and {(node.value?.length || 0) - 3} more items
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Calculate compliance statistics
  const flattenNodes = (node: SchemaNode): SchemaNode[] => {
    const result = [node];
    if (node.children) {
      node.children.forEach(child => {
        result.push(...flattenNodes(child));
      });
    }
    return result;
  };

  const allNodes = flattenNodes(schemaStructure);
  const requiredNodes = allNodes.filter(n => n.required);
  const compliantRequiredNodes = requiredNodes.filter(n => n.isCompliant && n.hasValue);
  const totalFields = allNodes.filter(n => !n.children || n.children.length === 0).length;
  const fieldsWithValues = allNodes.filter(n => n.hasValue && (!n.children || n.children.length === 0)).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-medium">Required Fields</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {compliantRequiredNodes.length}/{requiredNodes.length}
          </div>
          <div className="text-sm text-muted-foreground">Complete</div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Fields Populated</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {fieldsWithValues}/{totalFields}
          </div>
          <div className="text-sm text-muted-foreground">Have values</div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <span className="font-medium">Validation Issues</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {validationErrors.length}
          </div>
          <div className="text-sm text-muted-foreground">Issues found</div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-muted/30 rounded-lg p-4 mb-4">
        <h4 className="font-medium mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Field has valid value</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span>Required field missing</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span>Validation error</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            <span>Optional field empty</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="text-red-700 font-semibold">Red fields</span> are required • 
          <span className="text-gray-600 ml-1">Gray fields</span> are optional • 
          <span className="text-blue-600 ml-1">Blue text</span> shows data types • 
          <span className="text-green-700 ml-1">Green values</span> show actual data
        </div>
      </div>

      {/* Schema Tree */}
      <div className="bg-white border rounded-lg">
        <div className="bg-muted/50 px-4 py-3 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            📋 IEA Task 43 Schema Structure vs Your Data
          </h3>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto font-mono text-sm">
          {renderNode(schemaStructure)}
        </div>
      </div>
    </div>
  );
}</parameter>