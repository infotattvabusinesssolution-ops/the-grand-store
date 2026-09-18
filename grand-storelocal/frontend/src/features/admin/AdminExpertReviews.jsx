import React, { useState, useEffect } from 'react';
import { Star, Search, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import Price from '../../components/ui/Price';

export default function AdminExpertReviews() {
  const { products } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form State
  const [expertName, setExpertName] = useState('James Sinclair');
  const [expertTitle, setExpertTitle] = useState('Whisky Specialist');
  const [expertImage, setExpertImage] = useState('');
  const [verdict, setVerdict] = useState('');
  const [detailedReview, setDetailedReview] = useState('');
  const [aromaScore, setAromaScore] = useState('9');
  const [palateScore, setPalateScore] = useState('9.5');
  const [finishScore, setFinishScore] = useState('9');
  const [overallScore, setOverallScore] = useState('9.2');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.vendorId && p.vendorId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    // In a real app, fetch existing expert review here
    // For now we set defaults
    setVerdict('Excellent for collectors and experienced whisky drinkers. A truly remarkable expression that showcases the distillery character.');
    setDetailedReview('');
    setAromaScore('9');
    setPalateScore('9.5');
    setFinishScore('9');
    setOverallScore('9.2');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    // In a real app, send to API: POST /api/social-proof/expert-reviews
    const reviewData = {
      productId: selectedProduct._id || selectedProduct.id,
      expertName,
      expertTitle,
      expertImage,
      verdict,
      detailedReview,
      ratings: {
        overall: parseFloat(overallScore),
        criteria: [
          { label: 'Aroma', score: parseFloat(aromaScore) },
          { label: 'Palate', score: parseFloat(palateScore) },
          { label: 'Finish', score: parseFloat(finishScore) }
        ]
      }
    };
    
    console.log("Saving Expert Review:", reviewData);
    alert("Expert review saved successfully!");
    setSelectedProduct(null);
  };

  return (
    <div className="admin-expert-reviews">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-ivory)]">Expert Reviews</h1>
          <p className="text-[var(--color-ivory-muted)] text-sm mt-1">Manage editorial reviews and expert tasting notes for products.</p>
        </div>
      </div>

      {!selectedProduct ? (
        <div className="shell p-6 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-serif">Select Product to Review</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                className="bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-gold-500 outline-none w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-[var(--color-ivory-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => (
                  <tr key={product.id || product._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded overflow-hidden">
                          {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="font-medium text-[var(--color-ivory)]">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[var(--color-ivory-muted)]">{product.category}</td>
                    <td className="px-4 py-4 font-mono text-[var(--color-gold)]"><Price amount={product.price} /></td>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => handleSelectProduct(product)}
                        className="text-xs button button-gold py-1.5 px-3 flex items-center gap-2"
                      >
                        <Edit2 size={12} /> Edit Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-[var(--color-ivory-muted)]">No products found.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="shell p-6 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-serif text-gold-400">Editing Expert Review</h2>
              <p className="text-sm text-[var(--color-ivory-muted)]">{selectedProduct.name}</p>
            </div>
            <button 
              onClick={() => setSelectedProduct(null)}
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Expert Name</label>
                <input type="text" className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-gold-500 outline-none" value={expertName} onChange={(e) => setExpertName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Expert Title</label>
                <input type="text" className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-gold-500 outline-none" value={expertTitle} onChange={(e) => setExpertTitle(e.target.value)} required />
              </div>
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Verdict (Summary)</label>
              <textarea className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-gold-500 outline-none min-h-[80px]" value={verdict} onChange={(e) => setVerdict(e.target.value)} required placeholder="A short, powerful summary of the expert's opinion..."></textarea>
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Detailed Tasting Notes (Optional)</label>
              <textarea className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-gold-500 outline-none min-h-[120px]" value={detailedReview} onChange={(e) => setDetailedReview(e.target.value)} placeholder="Full review body..."></textarea>
            </div>
            
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-sm uppercase tracking-widest text-gold-400 mb-4">Scoring</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Overall / 10</label>
                  <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-gold-500 outline-none" value={overallScore} onChange={(e) => setOverallScore(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Aroma / 10</label>
                  <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-gold-500 outline-none" value={aromaScore} onChange={(e) => setAromaScore(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Palate / 10</label>
                  <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-gold-500 outline-none" value={palateScore} onChange={(e) => setPalateScore(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Finish / 10</label>
                  <input type="number" step="0.1" min="0" max="10" className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-gold-500 outline-none" value={finishScore} onChange={(e) => setFinishScore(e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="button button-gold px-8 py-3">Save Expert Review</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
