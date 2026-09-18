import { useMemo } from 'react';
import { useProducts } from '../context/ProductContext';

const clean = (value) => String(value || '').trim();

const unique = (values) => [...new Set(values.map(clean).filter(Boolean))]
  .sort((left, right) => left.localeCompare(right));

function CatalogField({
  id,
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  required = false
}) {
  const listId = options.length ? `${id}-options` : undefined;
  return (
    <div className="w-full group">
      <label
        htmlFor={id}
        className="block text-sm uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium mb-3"
      >
        {label}{required ? ' *' : ''}
      </label>
      <input
        type="text"
        id={id}
        name={name}
        value={value || ''}
        onChange={onChange}
        list={listId}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="block w-full px-4 py-3 text-base text-[var(--color-ivory)] bg-black/20 border border-[var(--color-gold)]/50 rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:bg-black/40 transition-colors"
      />
      {listId && (
        <datalist id={listId}>
          {options.map((option) => <option key={option} value={option} />)}
        </datalist>
      )}
    </div>
  );
}

export default function CatalogHierarchyFields({ formData, onChange, idPrefix }) {
  const { products } = useProducts();
  const category = clean(formData.type);
  const isWine = category.toLowerCase() === 'wine';

  const suggestions = useMemo(() => {
    const categoryProducts = products.filter((product) => (
      clean(product.category || product.type).toLowerCase() === category.toLowerCase()
    ));
    const countryProducts = formData.country
      ? categoryProducts.filter((product) => clean(product.country) === clean(formData.country))
      : categoryProducts;
    const subcategoryProducts = formData.subcategory
      ? countryProducts.filter((product) => clean(product.subcategory) === clean(formData.subcategory))
      : countryProducts;

    return {
      countries: unique(categoryProducts.map((product) => product.country)),
      subcategories: unique(countryProducts.map((product) => product.subcategory)),
      brands: unique(subcategoryProducts.map((product) => product.brand)),
      sizes: unique(categoryProducts.map((product) => product.size))
    };
  }, [category, formData.country, formData.subcategory, products]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <CatalogField
          id={`${idPrefix}-country`}
          label="Country"
          name="country"
          value={formData.country}
          onChange={onChange}
          options={suggestions.countries}
          placeholder="e.g. South Africa"
          required={isWine}
        />
        <CatalogField
          id={`${idPrefix}-subcategory`}
          label="Subcategory"
          name="subcategory"
          value={formData.subcategory}
          onChange={onChange}
          options={suggestions.subcategories}
          placeholder="e.g. Cabernet Sauvignon"
          required={isWine}
        />
        <CatalogField
          id={`${idPrefix}-brand`}
          label="Brand / Estate"
          name="brand"
          value={formData.brand}
          onChange={onChange}
          options={suggestions.brands}
          placeholder="e.g. Luc Mo Wines"
          required={isWine}
        />
        <CatalogField
          id={`${idPrefix}-size`}
          label="Bottle size"
          name="size"
          value={formData.size}
          onChange={onChange}
          options={suggestions.sizes}
          placeholder="e.g. 750ml"
          required={isWine}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
        <CatalogField
          id={`${idPrefix}-abv`}
          label="ABV"
          name="abv"
          value={formData.abv}
          onChange={onChange}
          placeholder="e.g. 13.5%"
        />
        <CatalogField
          id={`${idPrefix}-production`}
          label="Production method"
          name="production"
          value={formData.production}
          onChange={onChange}
          placeholder="e.g. Traditional Method"
        />
        <CatalogField
          id={`${idPrefix}-origin`}
          label="Region / origin"
          name="origin"
          value={formData.origin}
          onChange={onChange}
          placeholder="e.g. Stellenbosch, South Africa"
        />
      </div>

      {isWine && (
        <p className="-mt-5 text-xs leading-relaxed text-[#bba978]">
          Wine navigation is generated from Country → Subcategory → Brand → Product.
          New values entered here become available in the shop menus and filters after the product is saved.
        </p>
      )}
    </>
  );
}
