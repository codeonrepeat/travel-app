import React, { createContext, useContext, useState } from 'react';

const TripCartContext = createContext();

export const TripCartProvider = ({ children }) => {
  const [tripCart, setTripCart] = useState([]);

  const addToCart = (item) => {
    setTripCart((prev) => [...prev, item]);
  };

  const removeFromCart = (itemId) => {
    setTripCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => setTripCart([]);

  return (
    <TripCartContext.Provider value={{ tripCart, addToCart, removeFromCart, clearCart }}>
      {children}
    </TripCartContext.Provider>
  );
};

export const useTripCart = () => useContext(TripCartContext);
