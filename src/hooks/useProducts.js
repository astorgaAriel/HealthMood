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
        
        // Esperar siempre a la respuesta del servidor sin timeout
        console.log('Obteniendo productos del servidor...');
        const response = await apiService.getProducts();
        
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
          console.log('Productos de la base de datos cargados exitosamente');
        } else {
          console.error('Respuesta de la API no válida o vacía');
          setError('La respuesta del servidor no es válida. Por favor, contacta al administrador.');
          setProducts([]);
          setIsUsingFallback(false);
        }
        
      } catch (err) {
        // Si es cancelación, no hacer nada
        if (err.name === 'AbortError') {
          return;
        }
        
        console.error('Error al obtener productos de la base de datos:', err.message);
        setError(`Error de conexión: ${err.message}. Por favor, verifica que el servidor esté funcionando.`);
        setProducts([]);
        setIsUsingFallback(false);
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
      
      console.log('Reintentando obtener productos del servidor...');
      const response = await apiService.getProducts();
      const rawProducts = response.data || response;
      
      if (rawProducts && Array.isArray(rawProducts)) {
        // Usar la misma transformación que en el useEffect principal
        const transformedProducts = rawProducts.map(product => {
          // Extraer la primera imagen del array de imágenes
          let imageUrl = null;
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            imageUrl = product.images[0].imageUrl || product.images[0].url || product.images[0].src;
          }

          return {
            id: product.productId || product.id,
            name: product.name || 'Producto sin nombre',
            description: product.description || 'Sin descripción',
            price: product.price || 0,
            category: product.category?.name || String(product.category || 'Sin categoría'),
            image: imageUrl,
            rating: product.rating || 4.5,
            stock: product.stock !== undefined ? product.stock : 10,
            active: product.active !== undefined ? product.active : true
          };
        });
        
        setProducts(transformedProducts);
        setIsUsingFallback(false);
        
        // Actualizar cache
        productCache = transformedProducts;
        cacheTimestamp = Date.now();
        console.log('Productos actualizados desde la base de datos');
        
        return transformedProducts;
      } else {
        console.error('Respuesta de la API no válida al reintentar');
        setError('La respuesta del servidor no es válida. Por favor, contacta al administrador.');
        setProducts([]);
        setIsUsingFallback(false);
        return [];
      }
    } catch (err) {
      console.error('Error al reintentar obtener productos:', err.message);
      setError(`Error de conexión: ${err.message}. Por favor, verifica que el servidor esté funcionando.`);
      setProducts([]);
      setIsUsingFallback(false);
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
