import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import errorHandler, { ApiError } from '../utils/errorHandler';

interface EntityFormOptions<T> {
  // API-Funktionen
  getById?: (id: string) => Promise<{ data: T }>;
  create?: (data: T) => Promise<any>;
  update?: (id: string, data: T) => Promise<any>;

  // Validierungsfunktion
  validateForm?: (data: T) => Record<string, string>;

  // Initialdaten, falls kein existierendes Entity geladen wird
  initialData: T;

  // Pfad für die Navigation nach Speichern/Abbrechen
  returnPath: string;

  // Erfolgsmeldungen
  successMessageCreate?: string;
  successMessageUpdate?: string;

  // Verzögerung vor Navigation zurück (in ms)
  redirectDelay?: number;

  // Entity-ID für den Bearbeitungsmodus
  entityId?: string;
}

interface FormErrors {
  [key: string]: string;
}

/**
 * Hook für die Verwaltung von Entitätsformularen
 * Reduziert Code-Duplizierung in Formularkomponenten
 */
export const useEntityForm = <T extends Record<string, any>>(options: EntityFormOptions<T>) => {
  const {
    getById,
    create,
    update,
    validateForm,
    initialData,
    returnPath,
    successMessageCreate = 'Erfolgreich erstellt',
    successMessageUpdate = 'Erfolgreich aktualisiert',
    redirectDelay = 1500,
    entityId
  } = options;

  const navigate = useNavigate();
  const isEditMode = Boolean(entityId);

  // Formularstatus
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(isEditMode && !!getById);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Beim ersten Laden Daten abrufen, falls im Bearbeitungsmodus
  useEffect(() => {
    const loadEntity = async () => {
      if (!isEditMode || !getById) return;

      try {
        setLoading(true);
        const response = await getById(entityId!);
        setFormData(response.data);
      } catch (err) {
        console.error('Fehler beim Laden der Daten:', err);
        const apiError = err as ApiError;
        setSnackbar({
          open: true,
          message: apiError.message || 'Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadEntity();
  }, [entityId, getById, isEditMode]);

  // Formulareingaben behandeln
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as { name: string; value: unknown };

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Bei Änderung Fehler für das Feld löschen
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // Spezifischen Feldwert setzen
  const setFieldValue = useCallback((name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Bei Änderung Fehler für das Feld löschen
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // Formular validieren
  const validate = useCallback((): boolean => {
    if (!validateForm) return true;

    const newErrors = validateForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateForm]);

  // Formular speichern
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validierung durchführen, falls eine Validierungsfunktion bereitgestellt wurde
    if (validateForm && !validate()) {
      setSnackbar({
        open: true,
        message: 'Bitte korrigieren Sie die Fehler im Formular',
        severity: 'error'
      });
      return;
    }

    setSaving(true);

    try {
      if (isEditMode && update) {
        // Aktualisieren
        await update(entityId!, formData);
        setSnackbar({
          open: true,
          message: successMessageUpdate,
          severity: 'success'
        });
      } else if (create) {
        // Neu erstellen
        await create(formData);
        setSnackbar({
          open: true,
          message: successMessageCreate,
          severity: 'success'
        });
      }

      // Nach erfolgreicher Speicherung zurück zur Übersicht
      setTimeout(() => {
        navigate(returnPath);
      }, redirectDelay);
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      const apiError = err as ApiError;
      setSnackbar({
        open: true,
        message: apiError.message || `Fehler beim ${isEditMode ? 'Aktualisieren' : 'Erstellen'}`,
        severity: 'error'
      });
      setSaving(false);
    }
  }, [formData, isEditMode, entityId, create, update, validate, validateForm, successMessageCreate, successMessageUpdate, navigate, returnPath, redirectDelay]);

  // Abbrechen und zurück zur Übersicht
  const handleCancel = useCallback(() => {
    navigate(returnPath);
  }, [navigate, returnPath]);

  // Snackbar schließen
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  }, [snackbar]);

  // Datumsfelder verarbeiten
  const handleDateChange = useCallback((name: string, value: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: value ? value.toISOString().split('T')[0] : null
    }));

    // Bei Änderung Fehler für das Feld löschen
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    saving,
    snackbar,
    isEditMode,
    handleInputChange,
    setFieldValue,
    handleDateChange,
    handleSubmit,
    handleCancel,
    handleCloseSnackbar,
    validate
  };
};

export default useEntityForm;
