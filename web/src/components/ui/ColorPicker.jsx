import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';

const ColorPicker = ({ 
  value = '#ffffff',
  onChange,
  label,
  disabled = false,
  className = '',
  presets = [],
  allowNull = false,
  placeholder = 'Choose color',
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(value);
  const pickerRef = useRef(null);
  const colorInputRef = useRef(null);

  // Default color presets if none provided
  const defaultPresets = [
    { color: '#1f2937', name: 'Dark Gray' },
    { color: '#374151', name: 'Gray' },
    { color: '#ef4444', name: 'Red' },
    { color: '#f97316', name: 'Orange' },
    { color: '#eab308', name: 'Yellow' },
    { color: '#22c55e', name: 'Green' },
    { color: '#3b82f6', name: 'Blue' },
    { color: '#8b5cf6', name: 'Purple' },
    { color: '#ec4899', name: 'Pink' },
    { color: '#000000', name: 'Black' },
    { color: '#ffffff', name: 'White' }
  ];

  const colorPresets = presets.length > 0 ? presets : defaultPresets;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update temp color when value changes
  useEffect(() => {
    setTempColor(value);
  }, [value]);

  const handleColorChange = (newColor) => {
    setTempColor(newColor);
    onChange?.(newColor);
  };

  const handleInputChange = (event) => {
    const newColor = event.target.value;
    handleColorChange(newColor);
  };

  const handlePresetClick = (color) => {
    handleColorChange(color);
    setIsOpen(false);
  };

  const handleClearColor = () => {
    if (allowNull) {
      handleColorChange(null);
      setIsOpen(false);
    }
  };

  const openColorPicker = () => {
    if (!disabled) {
      // If value is null, use default color for picker
      const currentColor = value || '#ffffff';
      setTempColor(currentColor);
      colorInputRef.current?.click();
    }
  };

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="flex items-center space-x-2">
        {/* Color Preview Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm
            flex items-center justify-center transition-all duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'}
            ${!tempColor ? 'bg-gray-100' : ''}
          `}
          style={{ backgroundColor: tempColor || 'transparent' }}
          title={tempColor ? `Current color: ${tempColor}` : 'No color selected'}
        >
          {/* Show palette icon if color is null or too light to see */}
          {(!tempColor || tempColor === '#ffffff' || tempColor === '#fff') && (
            <Palette className={`w-4 h-4 ${!tempColor ? 'text-gray-500' : 'text-gray-400'}`} />
          )}
        </button>

        {/* Color Input */}
        <input
          ref={colorInputRef}
          type="color"
          value={tempColor}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        />

        {/* Manual Color Input */}
        <input
          type="text"
          value={tempColor || ''}
          onChange={(e) => handleColorChange(e.target.value || (allowNull ? null : '#ffffff'))}
          disabled={disabled}
          placeholder={allowNull ? placeholder : '#000000'}
          className={`
            input flex-1 font-mono text-sm
            ${disabled ? 'bg-gray-100 text-gray-500' : ''}
            ${!tempColor && allowNull ? 'italic text-gray-500' : ''}
          `}
          pattern="^#[0-9A-Fa-f]{6}$"
        />

        {/* Color Picker Button */}
        <button
          type="button"
          onClick={openColorPicker}
          disabled={disabled}
          className={`
            px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg
            transition-colors duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 focus:ring-2 focus:ring-primary-500'}
          `}
          title="Open color picker"
        >
          <Palette className="w-4 h-4" />
        </button>
      </div>

      {/* Color Presets Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-700">Color Presets</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {colorPresets.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handlePresetClick(preset.color)}
                className={`
                  w-8 h-8 rounded border-2 transition-all duration-200
                  hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500
                  ${tempColor === preset.color ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-300'}
                `}
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              >
                {/* Show check mark if selected and color is dark enough */}
                {tempColor === preset.color && (
                  <div className="w-full h-full flex items-center justify-center">
                    {/* Only show checkmark on light colors */}
                    {(['#ffffff', '#fff', '#eab308', '#fbbf24'].includes(preset.color.toLowerCase())) && (
                      <span className="text-gray-600 text-xs">✓</span>
                    )}
                    {(!['#ffffff', '#fff', '#eab308', '#fbbf24'].includes(preset.color.toLowerCase())) && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Custom Color Section */}
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            {allowNull && (
              <button
                type="button"
                onClick={handleClearColor}
                className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium py-2 px-3 rounded hover:bg-gray-50 transition-colors duration-200"
              >
                ✕ Use Default Color
              </button>
            )}
            <button
              type="button"
              onClick={openColorPicker}
              className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2 px-3 rounded hover:bg-primary-50 transition-colors duration-200"
            >
              Choose Custom Color...
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;