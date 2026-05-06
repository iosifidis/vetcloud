import React, { useState, useEffect, useRef } from 'react';

const ClientSearchDropdown = ({ clients, selectedClient, onSelect, disabled }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredClients, setFilteredClients] = useState([]);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!searchTerm.trim()) {
            // Safe check for clients
            setFilteredClients((clients || []).slice(0, 10));
            return;
        }
        const searchLower = searchTerm.toLowerCase();
        const filtered = (clients || []).filter(client => {
            const firstName = (client.firstName || '').toLowerCase();
            const lastName = (client.lastName || '').toLowerCase();
            const fullName = `${firstName} ${lastName}`;
            const phone = client.phoneNumber || client.phone || '';
            return (
                firstName.includes(searchLower) ||
                lastName.includes(searchLower) ||
                fullName.includes(searchLower) ||
                phone.includes(searchTerm)
            );
        });
        setFilteredClients(filtered.slice(0, 10));
    }, [searchTerm, clients]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (client) => {
        onSelect(client);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleClear = () => {
        onSelect(null);
        setSearchTerm('');
        inputRef.current?.focus();
    };

    const getClientDisplayName = (client) => {
        if (!client) return '';
        const phone = client.phoneNumber || client.phone || '';
        return `${client.firstName} ${client.lastName}${phone ? ` (${phone})` : ''}`;
    };

    if (disabled && selectedClient) {
        return (
            <div className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-100 text-gray-600 cursor-not-allowed">
                {getClientDisplayName(selectedClient)}
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {selectedClient ? (
                <div className="flex items-center justify-between w-full border border-gray-300 rounded-md px-4 py-2 bg-blue-50">
                    <span className="text-blue-700 font-medium">
                        {getClientDisplayName(selectedClient)}
                    </span>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                            ✕
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            placeholder="Search Client by Name or Phone..."
                            disabled={disabled}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    {isOpen && filteredClients.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredClients.map((client) => (
                                <div
                                    key={client.id}
                                    onClick={() => handleSelect(client)}
                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="font-medium text-gray-900">
                                        {client.firstName} {client.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        📞 {client.phoneNumber || client.phone || 'No phone'}
                                        {client.email && ` • ${client.email}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ClientSearchDropdown;
