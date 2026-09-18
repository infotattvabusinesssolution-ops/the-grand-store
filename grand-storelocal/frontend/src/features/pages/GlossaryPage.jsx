import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Search, Loader2 } from 'lucide-react';
import Footer from '../../components/Footer';

export default function GlossaryPage() {
  const [terms, setTerms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await api.get(`/glossary`);
        setTerms(response.data);
      } catch (error) {
        console.error('Error fetching glossary:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  const filteredTerms = terms.filter(item => 
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group terms by letter
  const groupedTerms = filteredTerms.reduce((acc, item) => {
    const letter = item.letter.toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#050505] text-[var(--color-ivory)] flex flex-col pt-24 font-sans">
      <div className="flex-1 w-full px-4 md:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif text-[var(--color-ivory)] mb-4 tracking-wider uppercase">
            Glossary of Terms
          </h1>
          <p className="text-[var(--color-ivory-muted)] max-w-2xl mx-auto text-sm md:text-base">
            Explore our comprehensive dictionary of fine wine and spirits terminology.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-16 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500 group-focus-within:text-[var(--color-gold)] transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] text-[var(--color-ivory)] placeholder-gray-500 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md"
            placeholder="Search for a term or definition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[var(--color-gold)] animate-spin" />
          </div>
        ) : filteredTerms.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-ivory-muted)]">
            No terms found matching "{searchTerm}"
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6 space-y-6">
            {filteredTerms.map((item) => (
              <div 
                key={item._id} 
                className="break-inside-avoid overflow-hidden group p-6 rounded-xl bg-[#111] border border-white/5 hover:border-[var(--color-gold)]/30 hover:bg-[#1a1a1a] transition-colors duration-200"
              >
                <h3 className="text-xl font-serif text-[var(--color-ivory)] mb-3 group-hover:text-[var(--color-gold)] transition-colors break-words">
                  {item.term}
                </h3>
                <p className="text-[var(--color-ivory-muted)] text-sm leading-relaxed break-words">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
