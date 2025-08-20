import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { products, categories } from '../utils/dummyData';
import { useCart } from '../../cart/hooks/useCart';
import './ProductList.css';

// Mapeo COMPLETO y CORREGIDO
const categoryMapping = {
  // Para Perros
  'perros': 'perros',
  'para perros': 'perros',
  
  // Para Gatos
  'gatos': 'gatos', 
  'para gatos': 'gatos',
  
  // Alimentos
  'alimento': 'Alimentos',
  'alimentos': 'Alimentos',
  'comida': 'Alimentos',
  'nutrición': 'Alimentos',
  
  // Juguetes/Accesorios
  'accesorios': 'Juguetes',
  'juguetes': 'Juguetes',
  'entretenimiento': 'Juguetes',
  
  // Salud/Higiene (ESTA ES LA PARTE IMPORTANTE)
  'salud e higiene': 'Cuidado',
  'salud-e-higiene': 'Cuidado',
  'salud': 'Cuidado',
  'higiene': 'Cuidado',
  'cuidado': 'Cuidado',
  'belleza': 'Cuidado',
  'limpieza': 'Cuidado'
};

export default function ProductList({ categoriaInicial }) {
  const { addToCart } = useCart();

  // Estados para filtros y paginación
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);

  // DEBUG: Ver qué categoría llega
  useEffect(() => {
    console.log('📍DEBUG:');
    console.log('categoriaInicial:', categoriaInicial);
    console.log('Category mapping:', categoryMapping);
    console.log('Todos los productos:', products.map(p => ({
      name: p.name,
      categories: p.category
    })));
  }, [categoriaInicial]);

  // Sincronizar categoría inicial desde URL
  useEffect(() => {
    if (categoriaInicial) {
      setCategory(categoriaInicial);
    }
  }, [categoriaInicial]);

  // Función para normalizar categorías - CORREGIDA
  const normalizeCategory = (cat) => {
    if (!cat) return '';
    
    try {
      // 1. Decodificar URL encoding (%20, %2C, etc.)
      const decodedCat = decodeURIComponent(cat.toString());
      const lowerCat = decodedCat.toLowerCase().trim();
      
      return categoryMapping[lowerCat] || lowerCat;
    } catch (error) {
      console.warn('Error normalizando categoría:', cat, error);
      return cat.toLowerCase().trim();
    }
  };

  // Filtrado optimizado - CORREGIDO
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    
    // Si no hay categoría seleccionada, mostrar todos
    if (category === '') return matchesSearch;
    
    // DEBUG: Ver qué se está comparando
    console.log('🔍 FILTRO ACTIVO:');
    console.log('Categoría seleccionada:', category);
    console.log('Categoría normalizada:', normalizeCategory(category));
    
    // Verificar si alguna categoría del producto coincide con la seleccionada
    const matchesCategory = product.category.some(productCat => {
      const normalizedProductCat = normalizeCategory(productCat);
      const normalizedFilterCat = normalizeCategory(category);
      
      console.log('Comparando:', normalizedProductCat, '===', normalizedFilterCat, 'Resultado:', normalizedProductCat === normalizedFilterCat);
      
      return normalizedProductCat === normalizedFilterCat;
    });
    
    console.log('Producto', product.name, 'coincide:', matchesCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Paginación
  const paginatedProducts = filteredProducts.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredProducts.length / limit);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [search, category, limit]);

  return (
    <div className="container-fluid px-4 py-4">
      {/* Barra de búsqueda */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-lg-8 col-md-7">
                  <div className="position-relative">
                    <i className="fas fa-search position-absolute top-50 translate-middle-y ms-3 text-muted"></i>
                    <input
                      className="form-control form-control-lg ps-5 rounded-pill"
                      placeholder="Buscar productos..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-lg-4 col-md-5">
                  <div className="d-flex align-items-center justify-content-end">
                    <span className="badge bg-primary bg-gradient fs-6 px-3 py-2 rounded-pill me-3">
                      {filteredProducts.length} productos
                    </span>
                    <button 
                      className="btn btn-outline-primary rounded-pill"
                      onClick={() => {
                        setSearch('');
                        setCategory('');
                      }}
                    >
                      <i className="fas fa-undo me-2"></i>
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Filtros laterales */}
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm p-3">
            <h5 className="card-title mb-4">Filtros</h5>

            {/* Selector de categoría sincronizado */}
            <div className="mb-4">
              <label className="form-label">Categoría</label>
              <select
                className="form-select rounded-pill"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">🏷️ Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Productos por página */}
            <div className="mb-4">
              <label className="form-label">Productos por página</label>
              <select
                className="form-select rounded-pill"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value="3">3 productos</option>
                <option value="6">6 productos</option>
                <option value="9">9 productos</option>
                <option value="12">12 productos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de productos */}
        <div className="col-lg-9">
          {paginatedProducts.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="fas fa-search fs-1 text-muted"></i>
              </div>
              <h3 className="text-muted mb-3">No se encontraron productos</h3>
              <p className="text-muted">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            <div className="row g-4">
              {paginatedProducts.map(product => (
                <div key={product.id} className="col-lg-4 col-md-6">
                  <div className="card border-0 shadow-sm h-100 position-relative product-card">
                    
                    {/* Badge de producto nuevo */}
                    <div className="position-absolute top-0 end-0 m-2 z-index-1">
                      <span className="badge bg-success rounded-pill px-2 py-1">
                        Nuevo
                      </span>
                    </div>

                    <Link to={`/products/${product.id}`} className="text-decoration-none">
                      <div className="d-flex flex-column h-100">
                        
                        {/* Imagen del producto */}
                        <div className="position-relative overflow-hidden" style={{ height: '200px' }}>
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-100 h-100 object-fit-cover"
                            style={{ transition: 'transform 0.3s ease' }}
                          />
                        </div>

                        {/* Contenido de la tarjeta */}
                        <div className="card-body d-flex flex-column flex-grow-1">
                          
                          {/* Categoría */}
                          <div className="mb-2">
                            <span className="badge bg-light text-primary rounded-pill px-2 py-1 small">
                              {product.category.join(' • ')}
                            </span>
                          </div>

                          {/* Nombre del producto */}
                          <h5 className="card-title text-dark fw-bold mb-2" style={{ fontSize: '1.1rem' }}>
                            {product.name}
                          </h5>

                          {/* Descripción */}
                          <p className="text-muted small mb-3 flex-grow-1">
                            {product.description}
                          </p>

                          {/* Rating */}
                          <div className="d-flex align-items-center mb-3">
                            <div className="text-warning me-2">
                              {[...Array(5)].map((_, i) => (
                                <i key={i} className={i < Math.floor(product.rating) ? "fas fa-star" : "far fa-star"}></i>
                              ))}
                            </div>
                            <span className="small text-muted">({product.rating})</span>
                          </div>

                          {/* Precio */}
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h4 className="text-primary fw-bold mb-0">
                                ${product.price.toLocaleString('es-CL')}
                              </h4>
                              <small className="text-success">
                                <i className="fas fa-truck me-1"></i>
                                Envío gratis
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    {/* Botón agregar al carrito */}
                    <div className="card-footer bg-white border-0 pt-0">
                      <button 
                        className="btn btn-primary w-100 rounded-pill fw-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product);
                        }}
                      >
                        <i className="fas fa-shopping-cart me-2"></i>
                        Agregar al carrito
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5">
              <nav>
                <ul className="pagination">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Anterior
                    </button>
                  </li>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${i + 1 === page ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}