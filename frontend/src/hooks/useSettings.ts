import { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../utils/api';

interface Category {
  id: number;
  name: string;
  description: string | null;
  type: 'device' | 'license' | 'certificate' | 'accessory';
  created_at: string;
  updated_at: string;
}

interface Location {
  id: number;
  name: string;
  address: string | null;
  zip_code: string | null;
  city: string;
  country: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: number;
  name: string;
  description: string | null;
  location_id: number;
  location_name?: string;
  manager_id: number | null;
  manager_name?: string;
  created_at: string;
  updated_at: string;
}

interface Room {
  id: number;
  name: string;
  floor: string | null;
  room_number: string | null;
  description: string | null;
  location_id: number;
  location_name?: string;
  created_at: string;
  updated_at: string;
}

interface SystemSettings {
  [key: string]: string;
}

interface UseSettingsReturn {
  // Kategorien
  categories: Category[];
  selectedCategory: Category | null;
  loadingCategories: boolean;
  errorCategories: string | null;
  loadCategories: () => Promise<void>;
  selectCategory: (id: number | null) => Promise<void>;
  createCategory: (data: Partial<Category>) => Promise<Category>;
  updateCategory: (id: number, data: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;

  // Standorte
  locations: Location[];
  selectedLocation: Location | null;
  loadingLocations: boolean;
  errorLocations: string | null;
  loadLocations: () => Promise<void>;
  selectLocation: (id: number | null) => Promise<void>;
  createLocation: (data: Partial<Location>) => Promise<Location>;
  updateLocation: (id: number, data: Partial<Location>) => Promise<Location>;
  deleteLocation: (id: number) => Promise<void>;

  // Abteilungen
  departments: Department[];
  selectedDepartment: Department | null;
  loadingDepartments: boolean;
  errorDepartments: string | null;
  loadDepartments: () => Promise<void>;
  selectDepartment: (id: number | null) => Promise<void>;
  createDepartment: (data: Partial<Department>) => Promise<Department>;
  updateDepartment: (id: number, data: Partial<Department>) => Promise<Department>;
  deleteDepartment: (id: number) => Promise<void>;

  // Räume
  rooms: Room[];
  selectedRoom: Room | null;
  loadingRooms: boolean;
  errorRooms: string | null;
  loadRooms: () => Promise<void>;
  selectRoom: (id: number | null) => Promise<void>;
  createRoom: (data: Partial<Room>) => Promise<Room>;
  updateRoom: (id: number, data: Partial<Room>) => Promise<Room>;
  deleteRoom: (id: number) => Promise<void>;

  // Systemeinstellungen
  systemSettings: SystemSettings;
  loadingSystemSettings: boolean;
  errorSystemSettings: string | null;
  loadSystemSettings: () => Promise<void>;
  updateSystemSettings: (data: Partial<SystemSettings>) => Promise<SystemSettings>;
}

export function useSettings(): UseSettingsReturn {
  // Zustand für Kategorien
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);

  // Zustand für Standorte
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(false);
  const [errorLocations, setErrorLocations] = useState<string | null>(null);

  // Zustand für Abteilungen
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [loadingDepartments, setLoadingDepartments] = useState<boolean>(false);
  const [errorDepartments, setErrorDepartments] = useState<string | null>(null);

  // Zustand für Räume
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);
  const [errorRooms, setErrorRooms] = useState<string | null>(null);

  // Zustand für Systemeinstellungen
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({});
  const [loadingSystemSettings, setLoadingSystemSettings] = useState<boolean>(false);
  const [errorSystemSettings, setErrorSystemSettings] = useState<string | null>(null);

  // Funktionen für Kategorien
  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    setErrorCategories(null);

    try {
      const response = await settingsApi.getAllCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      setErrorCategories(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const selectCategory = useCallback(async (id: number | null) => {
    if (id === null) {
      setSelectedCategory(null);
      return;
    }

    setLoadingCategories(true);
    setErrorCategories(null);

    try {
      const response = await settingsApi.getCategoryById(id);
      setSelectedCategory(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorie:', error);
      setErrorCategories(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const createCategory = useCallback(async (data: Partial<Category>) => {
    setLoadingCategories(true);
    setErrorCategories(null);

    try {
      const response = await settingsApi.createCategory(data);
      setCategories(prevCategories => [...prevCategories, response.data]);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen der Kategorie:', error);
      setErrorCategories(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: number, data: Partial<Category>) => {
    setLoadingCategories(true);
    setErrorCategories(null);

    try {
      const response = await settingsApi.updateCategory(id, data);
      setCategories(prevCategories =>
        prevCategories.map(category =>
          category.id === id ? { ...category, ...response.data } : category
        )
      );

      if (selectedCategory && selectedCategory.id === id) {
        setSelectedCategory(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Kategorie:', error);
      setErrorCategories(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingCategories(false);
    }
  }, [selectedCategory]);

  const deleteCategory = useCallback(async (id: number) => {
    setLoadingCategories(true);
    setErrorCategories(null);

    try {
      await settingsApi.deleteCategory(id);
      setCategories(prevCategories =>
        prevCategories.filter(category => category.id !== id)
      );

      if (selectedCategory && selectedCategory.id === id) {
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
      setErrorCategories(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingCategories(false);
    }
  }, [selectedCategory]);

  // Funktionen für Standorte
  const loadLocations = useCallback(async () => {
    setLoadingLocations(true);
    setErrorLocations(null);

    try {
      const response = await settingsApi.getAllLocations();
      setLocations(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Standorte:', error);
      setErrorLocations(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  const selectLocation = useCallback(async (id: number | null) => {
    if (id === null) {
      setSelectedLocation(null);
      return;
    }

    setLoadingLocations(true);
    setErrorLocations(null);

    try {
      const response = await settingsApi.getLocationById(id);
      setSelectedLocation(response.data);
    } catch (error) {
      console.error('Fehler beim Laden des Standorts:', error);
      setErrorLocations(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  const createLocation = useCallback(async (data: Partial<Location>) => {
    setLoadingLocations(true);
    setErrorLocations(null);

    try {
      const response = await settingsApi.createLocation(data);
      setLocations(prevLocations => [...prevLocations, response.data]);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Standorts:', error);
      setErrorLocations(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  const updateLocation = useCallback(async (id: number, data: Partial<Location>) => {
    setLoadingLocations(true);
    setErrorLocations(null);

    try {
      const response = await settingsApi.updateLocation(id, data);
      setLocations(prevLocations =>
        prevLocations.map(location =>
          location.id === id ? { ...location, ...response.data } : location
        )
      );

      if (selectedLocation && selectedLocation.id === id) {
        setSelectedLocation(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Standorts:', error);
      setErrorLocations(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingLocations(false);
    }
  }, [selectedLocation]);

  const deleteLocation = useCallback(async (id: number) => {
    setLoadingLocations(true);
    setErrorLocations(null);

    try {
      await settingsApi.deleteLocation(id);
      setLocations(prevLocations =>
        prevLocations.filter(location => location.id !== id)
      );

      if (selectedLocation && selectedLocation.id === id) {
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Standorts:', error);
      setErrorLocations(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingLocations(false);
    }
  }, [selectedLocation]);

  // Funktionen für Abteilungen
  const loadDepartments = useCallback(async () => {
    setLoadingDepartments(true);
    setErrorDepartments(null);

    try {
      const response = await settingsApi.getAllDepartments();
      setDepartments(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Abteilungen:', error);
      setErrorDepartments(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const selectDepartment = useCallback(async (id: number | null) => {
    if (id === null) {
      setSelectedDepartment(null);
      return;
    }

    setLoadingDepartments(true);
    setErrorDepartments(null);

    try {
      const response = await settingsApi.getDepartmentById(id);
      setSelectedDepartment(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Abteilung:', error);
      setErrorDepartments(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const createDepartment = useCallback(async (data: Partial<Department>) => {
    setLoadingDepartments(true);
    setErrorDepartments(null);

    try {
      const response = await settingsApi.createDepartment(data);
      setDepartments(prevDepartments => [...prevDepartments, response.data]);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen der Abteilung:', error);
      setErrorDepartments(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const updateDepartment = useCallback(async (id: number, data: Partial<Department>) => {
    setLoadingDepartments(true);
    setErrorDepartments(null);

    try {
      const response = await settingsApi.updateDepartment(id, data);
      setDepartments(prevDepartments =>
        prevDepartments.map(department =>
          department.id === id ? { ...department, ...response.data } : department
        )
      );

      if (selectedDepartment && selectedDepartment.id === id) {
        setSelectedDepartment(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Abteilung:', error);
      setErrorDepartments(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingDepartments(false);
    }
  }, [selectedDepartment]);

  const deleteDepartment = useCallback(async (id: number) => {
    setLoadingDepartments(true);
    setErrorDepartments(null);

    try {
      await settingsApi.deleteDepartment(id);
      setDepartments(prevDepartments =>
        prevDepartments.filter(department => department.id !== id)
      );

      if (selectedDepartment && selectedDepartment.id === id) {
        setSelectedDepartment(null);
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Abteilung:', error);
      setErrorDepartments(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingDepartments(false);
    }
  }, [selectedDepartment]);

  // Funktionen für Räume
  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    setErrorRooms(null);

    try {
      const response = await settingsApi.getAllRooms();
      setRooms(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Räume:', error);
      setErrorRooms(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const selectRoom = useCallback(async (id: number | null) => {
    if (id === null) {
      setSelectedRoom(null);
      return;
    }

    setLoadingRooms(true);
    setErrorRooms(null);

    try {
      const response = await settingsApi.getRoomById(id);
      setSelectedRoom(response.data);
    } catch (error) {
      console.error('Fehler beim Laden des Raums:', error);
      setErrorRooms(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const createRoom = useCallback(async (data: Partial<Room>) => {
    setLoadingRooms(true);
    setErrorRooms(null);

    try {
      const response = await settingsApi.createRoom(data);
      setRooms(prevRooms => [...prevRooms, response.data]);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Raums:', error);
      setErrorRooms(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const updateRoom = useCallback(async (id: number, data: Partial<Room>) => {
    setLoadingRooms(true);
    setErrorRooms(null);

    try {
      const response = await settingsApi.updateRoom(id, data);
      setRooms(prevRooms =>
        prevRooms.map(room =>
          room.id === id ? { ...room, ...response.data } : room
        )
      );

      if (selectedRoom && selectedRoom.id === id) {
        setSelectedRoom(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Raums:', error);
      setErrorRooms(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingRooms(false);
    }
  }, [selectedRoom]);

  const deleteRoom = useCallback(async (id: number) => {
    setLoadingRooms(true);
    setErrorRooms(null);

    try {
      await settingsApi.deleteRoom(id);
      setRooms(prevRooms =>
        prevRooms.filter(room => room.id !== id)
      );

      if (selectedRoom && selectedRoom.id === id) {
        setSelectedRoom(null);
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Raums:', error);
      setErrorRooms(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingRooms(false);
    }
  }, [selectedRoom]);

  // Funktionen für Systemeinstellungen
  const loadSystemSettings = useCallback(async () => {
    setLoadingSystemSettings(true);
    setErrorSystemSettings(null);

    try {
      const response = await settingsApi.getSystemSettings();
      setSystemSettings(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Systemeinstellungen:', error);
      setErrorSystemSettings(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoadingSystemSettings(false);
    }
  }, []);

  const updateSystemSettings = useCallback(async (data: Partial<SystemSettings>) => {
    setLoadingSystemSettings(true);
    setErrorSystemSettings(null);

    try {
      const response = await settingsApi.updateSystemSettings(data);
      setSystemSettings(prevSettings => ({ ...prevSettings, ...response.data }));
      return response.data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Systemeinstellungen:', error);
      setErrorSystemSettings(error instanceof Error ? error.message : 'Unbekannter Fehler');
      throw error;
    } finally {
      setLoadingSystemSettings(false);
    }
  }, []);

  // Initialer Ladevorgang
  useEffect(() => {
    // Hier können wir entscheiden, welche Daten beim ersten Rendern geladen werden sollen
    // loadCategories();
    // loadLocations();
    // loadDepartments();
    // loadRooms();
    // loadSystemSettings();
  }, []);

  return {
    // Kategorien
    categories,
    selectedCategory,
    loadingCategories,
    errorCategories,
    loadCategories,
    selectCategory,
    createCategory,
    updateCategory,
    deleteCategory,

    // Standorte
    locations,
    selectedLocation,
    loadingLocations,
    errorLocations,
    loadLocations,
    selectLocation,
    createLocation,
    updateLocation,
    deleteLocation,

    // Abteilungen
    departments,
    selectedDepartment,
    loadingDepartments,
    errorDepartments,
    loadDepartments,
    selectDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,

    // Räume
    rooms,
    selectedRoom,
    loadingRooms,
    errorRooms,
    loadRooms,
    selectRoom,
    createRoom,
    updateRoom,
    deleteRoom,

    // Systemeinstellungen
    systemSettings,
    loadingSystemSettings,
    errorSystemSettings,
    loadSystemSettings,
    updateSystemSettings,
  };
}
