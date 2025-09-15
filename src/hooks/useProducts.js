// src/hooks/useProducts.js
import { useState, useEffect, useMemo, useRef } from 'react';
import apiService from '../services/api';
import { MOCK } from '../modules/home/utils/dummyData';

// Cache temporal (5 minutos)
let productCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar cache temporal
        const now = Date.now();
        if (productCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
          console.log('Usando productos en cache');
          setProducts(productCache);
          setIsUsingFallback(false);
          setLoading(false);
          return;
        }

        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Crear nuevo AbortController
        abortControllerRef.current = new AbortController();
        
        // Timeout más agresivo para mejor UX
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API_TIMEOUT')), 4000)
        );
        
        const apiPromise = apiService.getProducts();
        
        const response = await Promise.race([apiPromise, timeoutPromise]);
        
        // El backend puede devolver los datos directamente o en response.data
        const rawProducts = response.data || response;
        
        // Verificar si la respuesta es válida
        if (rawProducts && Array.isArray(rawProducts)) {
          
          // Transformar la estructura del backend al formato esperado del frontend
          const transformedProducts = rawProducts.map(product => {
            // Extraer la primera imagen del array de imágenes
            let imageUrl = null;
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
              imageUrl = product.images[0].imageUrl || product.images[0].url || product.images[0].src;
            }

            return {
              // Mapear productId a id
              id: product.productId || product.id,
              // Mapear campos básicos
              name: product.name || 'Producto sin nombre',
              description: product.description || 'Sin descripción',
              price: product.price || 0,
              // Extraer nombre de categoría del objeto
              category: product.category?.name || String(product.category || 'Sin categoría'),
              // Extraer primera imagen del array
              image: imageUrl,
              // Campos adicionales
              rating: product.rating || 4.5,
              stock: product.stock !== undefined ? product.stock : 10,
              active: product.active !== undefined ? product.active : true
            };
          });
          
          setProducts(transformedProducts);
          setIsUsingFallback(false);
          
          // Guardar en cache
          productCache = transformedProducts;
          cacheTimestamp = Date.now();
          console.log('Productos guardados en cache');
        } else {
          console.warn('API response not valid, using fallback data');
          setProducts(MOCK);
          setIsUsingFallback(true);
        }
        
      } catch (err) {
        // Si es cancelación, no hacer nada
        if (err.name === 'AbortError') {
          return;
        }
        
        console.warn('API error, using fallback data:', err.message);
        if (err.message === 'API_TIMEOUT') {
          setError('El servidor está tardando en responder. Mostrando productos de ejemplo.');
        } else {
          setError(err.message);
        }
        setProducts(MOCK);
        setIsUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    
    // Cleanup: cancelar request al desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Sin dependencias - se ejecuta solo una vez

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getProducts();
      const rawProducts = response.data || response;
      
      if (rawProducts && Array.isArray(rawProducts)) {
        const transformedProducts = rawProducts.map(product => ({
          id: product.productId || product.id,
          name: product.name || 'Producto sin nombre',
          description: product.description || 'Sin descripción',
          price: product.price || 0,
          category: product.category || 'Sin categoría',
          image: product.images || product.imageUrl || product.image || DEFAULT_PRODUCT_IMAGE,
          rating: product.rating || 4.5,
          stock: product.stock !== undefined ? product.stock : 10,
          active: product.active !== undefined ? product.active : true
        }));
        
        setProducts(transformedProducts);
        setIsUsingFallback(false);
        return transformedProducts;
      } else {
        setProducts(MOCK);
        setIsUsingFallback(true);
        return MOCK;
      }
    } catch (err) {
      setError(err.message);
      setProducts(MOCK);
      setIsUsingFallback(true);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar cache
  const clearCache = () => {
    productCache = null;
    cacheTimestamp = null;
    console.log('Cache de productos limpiado');
  };

  // Memorizar los productos para evitar re-renders innecesarios
  const memoizedProducts = useMemo(() => products, [products]);

  return { 
    products: memoizedProducts, 
    loading, 
    error, 
    refetch, 
    isUsingFallback,
    clearCache
  };
};
