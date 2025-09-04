import React, { useState } from 'react';
import { Globe, Users, Lock, ChevronDown } from 'lucide-react';

export type PrivacyLevel = 'public' | 'friends' | 'private';

interface PrivacySelectorProps {
  value: PrivacyLevel;
  onChange: (privacy: PrivacyLevel) => void;
  className?: string;
}

const privacyOptions = [
  {
    value: 'public' as PrivacyLevel,
    label: 'Public',
    description: 'Anyone can see this post',
    icon: Globe,
    color: 'text-emerald-400'
  },
  {
    value: 'friends' as PrivacyLevel,
    label: 'Friends',
    description: 'Only your friends can see this post',
    icon: Users,
    color: 'text-blue-400'
  },
  {
    value: 'private' as PrivacyLevel,
    label: 'Private',
    description: 'Only you can see this post',
    icon: Lock,
    color: 'text-amber-400'
  }
];

export function PrivacySelector({ value, onChange, className = '' }: PrivacySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = privacyOptions.find(option => option.value === value);

  const handleSelect = (privacy: PrivacyLevel) => {
    onChange(privacy);
    setIsOpen(false);
  };

  if (!selectedOption) return null;

  const Icon = selectedOption.icon;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-emerald-900/50 hover:bg-emerald-900/70 border border-emerald-800/40 rounded-xl text-sm text-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
        aria-label="Select privacy level"
      >
        <Icon className={`h-4 w-4 ${selectedOption.color}`} />
        <span>{selectedOption.label}</span>
        <ChevronDown className="h-3 w-3 text-emerald-400" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-emerald-950/95 border border-emerald-800/40 rounded-xl shadow-xl backdrop-blur z-20">
            <div className="p-2">
              {privacyOptions.map((option) => {
                const OptionIcon = option.icon;
                const isSelected = option.value === value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                      isSelected 
                        ? 'bg-emerald-800/50 text-emerald-50' 
                        : 'hover:bg-emerald-900/50 text-emerald-100'
                    }`}
                  >
                    <OptionIcon className={`h-5 w-5 mt-0.5 ${option.color}`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {option.label}
                      </div>
                      <div className="text-xs text-emerald-300/70 mt-1">
                        {option.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-emerald-400 mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
