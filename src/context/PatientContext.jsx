import { createContext, useContext, useState } from 'react';

const PatientContext = createContext(null);

export const PatientProvider = ({ children }) => {
    const [activePatient, setActivePatient] = useState(null);

    const clearActivePatient = () => setActivePatient(null);

    return (
        <PatientContext.Provider value={{ activePatient, setActivePatient, clearActivePatient }}>
            {children}
        </PatientContext.Provider>
    );
};

export const usePatient = () => useContext(PatientContext);
