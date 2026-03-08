import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import { clientService } from '../../../services/clientService';
import { storageService } from '../../../services/storageService';

const ProjectDetailsTab = ({ formData, onChange }) => {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [tempPinLocation, setTempPinLocation] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [logoCache, setLogoCache] = useState({});
  const dropdownRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const projectTypes = [
    'Residential Single Family',
    'Residential Multi-Family',
    'Hotels & Hospitality',
    'Commercial',
    'Office',
    'Hospital',
    'Education',
    'Other'
  ];

  const scopeOptions = [
    'Design & Engineering',
    'AOR',
    'STROR',
    'EOR',
    'Inspection',
    'To Port',
    'Shipping',
    'Port to Site',
    'Placement',
    'Site Mobility',
    'Zipping',
    'Internal works',
    'Hand Over',
    'Financing'
  ];

  // Country, State, City data
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IN', name: 'India' },
    { code: 'CN', name: 'China' },
    { code: 'JP', name: 'Japan' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'PL', name: 'Poland' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'AT', name: 'Austria' },
    { code: 'BE', name: 'Belgium' },
    { code: 'IE', name: 'Ireland' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'SG', name: 'Singapore' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KR', name: 'South Korea' },
    { code: 'TH', name: 'Thailand' },
  ];

  const statesByCountry = {
    US: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
      'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
      'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
      'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
      'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
      'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
      'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
    ],
    CA: [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
      'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
      'Quebec', 'Saskatchewan', 'Yukon'
    ],
    GB: [
      'England', 'Scotland', 'Wales', 'Northern Ireland'
    ],
    AU: [
      'New South Wales', 'Victoria', 'Queensland', 'South Australia', 'Western Australia',
      'Tasmania', 'Northern Territory', 'Australian Capital Territory'
    ],
    DE: [
      'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse',
      'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate',
      'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
    ],
    IN: [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
      'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
      'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
      'West Bengal'
    ],
  };

  const availableStates = formData?.country ? (statesByCountry?.[formData?.country] || []) : [];

  const handleOpenGoogleMaps = () => {
    const { country, state, city } = formData || {};
    let searchQuery = '';
    
    if (city) searchQuery += city;
    if (state) searchQuery += (searchQuery ? ', ' : '') + state;
    if (country) {
      const countryName = countries?.find(c => c?.code === country)?.name;
      if (countryName) searchQuery += (searchQuery ? ', ' : '') + countryName;
    }
    
    setIsMapModalOpen(true);
    setTempPinLocation(null);
    
    // Load Google Maps script if not already loaded
    if (!window.google) {
      const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
        alert('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
        setIsMapModalOpen(false);
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => {
        alert('Failed to load Google Maps. Please check your API key and ensure the Maps JavaScript API is enabled.');
        setIsMapModalOpen(false);
      };
      document.head?.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  };

  const initializeMap = () => {
    if (!window.google || !mapRef?.current) return;

    const { country, state, city } = formData || {};
    
    // Default center (world view)
    let center = { lat: 20, lng: 0 };
    let zoom = 2;

    // If we have location data, try to geocode it
    const locationString = [
      city,
      state,
      countries?.find(c => c?.code === country)?.name
    ]?.filter(Boolean)?.join(', ');

    const map = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: zoom,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;

    // Geocode the location if available
    if (locationString) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder?.geocode({ address: locationString }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          map?.setCenter(results?.[0]?.geometry?.location);
          map?.setZoom(12);
        }
      });
    }

    // Add click listener to drop pin
    map?.addListener('click', (event) => {
      const lat = event?.latLng?.lat();
      const lng = event?.latLng?.lng();
      
      // Remove existing marker if any
      if (markerRef?.current) {
        markerRef?.current?.setMap(null);
      }

      // Create new marker
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        animation: window.google.maps.Animation.DROP,
        title: 'Selected Location'
      });

      markerRef.current = marker;

      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder?.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setTempPinLocation({
            lat,
            lng,
            address: results?.[0]?.formatted_address
          });
        } else {
          setTempPinLocation({
            lat,
            lng,
            address: `${lat?.toFixed(6)}, ${lng?.toFixed(6)}`
          });
        }
      });
    });
  };

  useEffect(() => {
    if (mapLoaded && isMapModalOpen) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap();
      }, 100);
    }

    // Cleanup
    return () => {
      if (markerRef?.current) {
        markerRef?.current?.setMap(null);
        markerRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [mapLoaded, isMapModalOpen]);

  const handleLocationSelect = () => {
    if (!tempPinLocation) {
      alert('Please click on the map to drop a pin first.');
      return;
    }

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${tempPinLocation?.lat},${tempPinLocation?.lng}`;
    
    const locationData = {
      address: tempPinLocation?.address,
      url: mapsUrl,
      lat: tempPinLocation?.lat,
      lng: tempPinLocation?.lng
    };
    
    setSelectedLocation(locationData);
    onChange('selectedMapLocation', locationData);
    setIsMapModalOpen(false);
    setTempPinLocation(null);
  };

  useEffect(() => {
    // Load selected location from formData if it exists
    if (formData?.selectedMapLocation) {
      setSelectedLocation(formData?.selectedMapLocation);
    }
  }, [formData?.selectedMapLocation]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch clients function - MUST be defined before useEffect that calls it
  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const data = await clientService?.getAllClients();
      
      // Set clients immediately so the dropdown is usable right away
      setClients(data || []);
      
      // If formData has clientId, find and set the selected client
      if (formData?.clientId && data) {
        const client = data?.find(c => c?.id === formData?.clientId);
        setSelectedClient(client || null);
      }
      
      // Fetch signed URLs for client logos in the background (non-blocking)
      Promise.all(
        (data || [])?.map(async (client) => {
          if (client?.logo) {
            try {
              const signedUrl = await storageService?.getClientLogoUrl(client?.logo);
              return { ...client, logoUrl: signedUrl };
            } catch {
              return client;
            }
          }
          return client;
        })
      ).then((clientsWithLogos) => {
        setClients(clientsWithLogos || []);
      }).catch((err) => {
        console.error('Error fetching client logos:', err);
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Re-match selected client when formData.clientId changes (e.g., after loading a saved proposal)
  useEffect(() => {
    if (formData?.clientId && clients?.length > 0) {
      const client = clients.find(c => c?.id === formData.clientId);
      if (client && (!selectedClient || selectedClient?.id !== client?.id)) {
        setSelectedClient(client);
      }
    }
  }, [formData?.clientId, clients]);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    onChange('clientId', client?.id);
    onChange('clientName', client?.company_name || '');
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const filteredClients = clients?.filter((client) => {
    const query = searchQuery?.toLowerCase();
    return (
      client?.company_name?.toLowerCase()?.includes(query) ||
      client?.primary_contact?.toLowerCase()?.includes(query) ||
      client?.email?.toLowerCase()?.includes(query)
    );
  });

  const handleScopeToggle = (scope) => {
    const currentScopes = formData?.scope || [];
    const newScopes = currentScopes?.includes(scope)
      ? currentScopes?.filter(s => s !== scope)
      : [...currentScopes, scope];
    onChange('scope', newScopes);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Project Details</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Configure project information and client details
        </p>
      </div>

      {/* Project Information */}
      <div className="border border-border rounded-lg p-6">
        <div className="space-y-4">
          {/* Client Selection and Project Information - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Client Selection - Left Half */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Icon name="Users" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Client Selection
              </h3>

              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Client *
                </label>
                
                {loadingClients ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading clients...</span>
                  </div>
                ) : (
                  <>
                    <div
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-700 flex items-center justify-between"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      {selectedClient ? (
                        <div className="flex items-center gap-3">
                          {selectedClient?.logo ? (
                            logoCache?.[selectedClient?.logo] ? (
                              <img
                                src={logoCache?.[selectedClient?.logo]}
                                alt={selectedClient?.logo_alt || `${selectedClient?.company_name} logo`}
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-600 animate-pulse"></div>
                            )
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <Icon name="Building" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{selectedClient?.company_name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{selectedClient?.primary_contact}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Select a client...</span>
                      )}
                      <Icon
                        name={isDropdownOpen ? 'ChevronUp' : 'ChevronDown'}
                        className="w-5 h-5 text-gray-400 dark:text-gray-500"
                      />
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-hidden">
                        <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                          <div className="relative">
                            <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <input
                              type="text"
                              placeholder="Search clients..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e?.target?.value)}
                              className="w-full pl-10 pr-4 py-1.5 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="overflow-y-auto max-h-80">
                          {filteredClients?.length > 0 ? (
                            filteredClients?.map((client) => (
                              <div
                                key={client?.id}
                                onClick={() => handleClientSelect(client)}
                                className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  {client?.logo ? (
                                    logoCache?.[client?.logo] ? (
                                      <img
                                        src={logoCache?.[client?.logo]}
                                        alt={client?.logo_alt || `${client?.company_name} logo`}
                                        className="w-10 h-10 rounded object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-600 animate-pulse"></div>
                                    )
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                      <Icon name="Building" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{client?.company_name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{client?.primary_contact}</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{client?.email}</div>
                                  </div>
                                  {client?.status && (
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      client?.status === 'Active' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                                      client?.status === 'Inactive'? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                                    }`}>
                                      {client?.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                              <Icon name="Search" className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
                              <p>No clients found</p>
                              <p className="text-sm mt-1">Try adjusting your search</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Selected Client Details */}
              {selectedClient && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-4">
                    {selectedClient?.logoUrl && (
                      <img
                        src={selectedClient?.logoUrl}
                        alt={selectedClient?.logo_alt || 'Client logo'}
                        className="w-16 h-16 object-contain rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Company Name:</span>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedClient?.company_name}</p>
                      </div>
                      {selectedClient?.email && (
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Website/Email:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">{selectedClient?.email}</p>
                        </div>
                      )}
                      {selectedClient?.primary_contact && (
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Primary Contact:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">{selectedClient?.primary_contact}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Project Information - Right Half */}
            <div className="bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg p-4 space-y-2 transition-colors">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Icon name="FileText" size={20} className="text-gray-700 dark:text-gray-300" />
                Project Information
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Project Name</label>
                <input
                  type="text"
                  value={formData?.projectName || ''}
                  onChange={(e) => onChange('projectName', e?.target?.value)}
                  className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Project Type</label>
                <select
                  value={formData?.projectType || ''}
                  onChange={(e) => onChange('projectType', e?.target?.value)}
                  className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="" className="dark:bg-gray-700">-- Select project type --</option>
                  {projectTypes?.map((type) => (
                    <option key={type} value={type} className="dark:bg-gray-700">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Client Type</label>
                <select
                  value={formData?.clientType || ''}
                  onChange={(e) => onChange('clientType', e?.target?.value)}
                  className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-red-600 dark:text-red-400"
                >
                  <option value="" className="dark:bg-gray-700">-- Select client type --</option>
                  <option value="Government" className="text-red-600 dark:text-red-400 dark:bg-gray-700">Government</option>
                  <option value="Private" className="dark:bg-gray-700">Private</option>
                  <option value="Commercial" className="dark:bg-gray-700">Commercial</option>
                  <option value="Residential" className="dark:bg-gray-700">Residential</option>
                </select>
              </div>
            </div>
          </div>

          {/* Second Row: Location, Budget, and Scope */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Location & Address - 1/4 width (1 column) - Reduced height */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg p-4 space-y-2 transition-colors">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Icon name="MapPin" size={20} className="text-gray-700 dark:text-gray-300" />
                Project Location & Address
              </h3>

              {/* Country, State, City Selection - Compact */}
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Country</label>
                  <select
                    value={formData?.country || ''}
                    onChange={(e) => {
                      onChange('country', e?.target?.value);
                      onChange('state', '');
                      onChange('city', '');
                    }}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="" className="dark:bg-gray-700">-- Select Country --</option>
                    {countries?.map((country) => (
                      <option key={country?.code} value={country?.code} className="dark:bg-gray-700">
                        {country?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">State/Province</label>
                  {availableStates?.length > 0 ? (
                    <select
                      value={formData?.state || ''}
                      onChange={(e) => {
                        onChange('state', e?.target?.value);
                        onChange('city', '');
                      }}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!formData?.country}
                    >
                      <option value="" className="dark:bg-gray-700">-- Select State --</option>
                      {availableStates?.map((state) => (
                        <option key={state} value={state} className="dark:bg-gray-700">
                          {state}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData?.state || ''}
                      onChange={(e) => onChange('state', e?.target?.value)}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="Enter state/province"
                      disabled={!formData?.country}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">City</label>
                  <input
                    type="text"
                    value={formData?.city || ''}
                    onChange={(e) => onChange('city', e?.target?.value)}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Enter city"
                    disabled={!formData?.country}
                  />
                </div>
              </div>

              {/* Google Maps Button - Compact */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleOpenGoogleMaps}
                  className="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!formData?.country}
                >
                  <Icon name="Map" size={16} />
                  Select Location on Google Maps
                </button>
                {!formData?.country && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Select a country to enable map access</span>
                )}
              </div>

              {/* Full Address - Compact */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Address (Optional)</label>
                <textarea
                  value={formData?.projectAddress || ''}
                  onChange={(e) => onChange('projectAddress', e?.target?.value)}
                  className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Enter complete street address, building number, etc."
                  rows={2}
                />
              </div>
            </div>

            {/* Budget & Area - 1/4 width (1 column) */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg p-4 space-y-2 transition-colors">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Icon name="DollarSign" size={20} className="text-gray-700 dark:text-gray-300" />
                Budget & Area
              </h3>

              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Target Budget ($/SQFT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData?.targetBudgetPerSqft || ''}
                    onChange={(e) => onChange('targetBudgetPerSqft', e?.target?.value)}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Estimated Area (SQFT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData?.estimatedAreaSqft || ''}
                    onChange={(e) => onChange('estimatedAreaSqft', e?.target?.value)}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Calculated Total Budget */}
              {formData?.targetBudgetPerSqft && formData?.estimatedAreaSqft && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Estimated Total Budget:</span>
                    <span className="text-lg font-bold text-blue-900 dark:text-blue-200">
                      ${(parseFloat(formData?.targetBudgetPerSqft) * parseFloat(formData?.estimatedAreaSqft))?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Scope Selection - 2/4 width (2 columns) - 3 column layout for checkboxes */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg p-4 space-y-2 transition-colors">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Icon name="CheckSquare" size={20} className="text-gray-700 dark:text-gray-300" />
                Scope (Multi-Select)
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {scopeOptions?.map((scope) => {
                  const isSelected = (formData?.scope || [])?.includes(scope);
                  return (
                    <label
                      key={scope}
                      className="flex items-center gap-2 p-2 border border-border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleScopeToggle(scope)}
                        className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary flex-shrink-0 bg-white dark:bg-gray-700"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{scope}</span>
                    </label>
                  );
                })}
              </div>

              {/* Selected Scopes Summary */}
              {formData?.scope && formData?.scope?.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                    Selected Scopes ({formData?.scope?.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData?.scope?.map((scope) => (
                      <span
                        key={scope}
                        className="px-3 py-1 bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-200 rounded-full text-xs font-medium"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Location Display - Full Width */}
          {selectedLocation && (
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                    <Icon name="MapPin" size={16} />
                    Selected Location (Pinned):
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-200 mb-2">{selectedLocation?.address}</div>
                  {selectedLocation?.lat && selectedLocation?.lng && (
                    <div className="text-xs text-green-700 dark:text-green-300 mb-2">
                      Coordinates: {selectedLocation?.lat?.toFixed(6)}, {selectedLocation?.lng?.toFixed(6)}
                    </div>
                  )}
                  <a
                    href={selectedLocation?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    <Icon name="ExternalLink" size={14} />
                    View Pinned Location on Google Maps
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocation(null);
                    onChange('selectedMapLocation', null);
                  }}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove location"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Location Summary - Full Width */}
          {(formData?.country || formData?.state || formData?.city) && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Location Summary:</div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                {[
                    formData?.city,
                    formData?.state,
                    countries?.find(c => c?.code === formData?.country)?.name
                ]?.filter(Boolean)?.join(', ')}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Google Maps Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Icon name="Map" size={24} />
                Drop Pin on Google Maps
              </h3>
              <button
                onClick={() => {
                  setIsMapModalOpen(false);
                  setTempPinLocation(null);
                  if (markerRef?.current) {
                    markerRef?.current?.setMap(null);
                    markerRef.current = null;
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name="X" size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
              {/* Location Info */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Icon name="MapPin" size={16} />
                  Search Area:
                </div>
                <div className="text-sm text-blue-800">
                  {[
                    formData?.city,
                    formData?.state,
                    countries?.find(c => c?.code === formData?.country)?.name
                  ]?.filter(Boolean)?.join(', ') || 'World'}
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm text-yellow-800 flex items-start gap-2">
                  <Icon name="Info" size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>How to use:</strong> Click anywhere on the map below to drop a pin at your desired location. The pin will mark the exact project location.
                  </div>
                </div>
              </div>

              {/* Google Maps Container */}
              <div className="relative w-full h-[400px] rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100">
                {!mapLoaded ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <div className="text-sm text-gray-600">Loading Google Maps...</div>
                    </div>
                  </div>
                ) : (
                  <div ref={mapRef} className="w-full h-full" />
                )}
              </div>

              {/* Selected Pin Info */}
              {tempPinLocation && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
                    <Icon name="MapPin" size={16} />
                    Pin Dropped:
                  </div>
                  <div className="text-sm text-green-800 mb-1">{tempPinLocation?.address}</div>
                  <div className="text-xs text-green-700">
                    Coordinates: {tempPinLocation?.lat?.toFixed(6)}, {tempPinLocation?.lng?.toFixed(6)}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsMapModalOpen(false);
                  setTempPinLocation(null);
                  if (markerRef?.current) {
                    markerRef?.current?.setMap(null);
                    markerRef.current = null;
                  }
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLocationSelect}
                disabled={!tempPinLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Icon name="Check" size={18} />
                Confirm Pin Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsTab;