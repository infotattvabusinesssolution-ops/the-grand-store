export default function IconButton({ label, children, count, onClick, className = '' }) {
  return (
    <button 
      className={`relative inline-grid w-[42px] h-[42px] p-0 place-items-center border border-white/10 rounded-full text-[#eee8dd] bg-white/5 cursor-pointer transition-all duration-180 hover:border-[#c9a35b] hover:text-[#e1bd70] hover:bg-[#c9a35b]/10 hover:-translate-y-0.5 ${className}`} 
      type="button" 
      aria-label={label} 
      onClick={onClick}
    >
      {children}
      {typeof count === 'number' && (
        <span className="absolute -top-1 -right-1 grid min-w-[17px] h-[17px] px-1 place-items-center border-2 border-[#080807] rounded-full text-[#15110a] bg-[#e1bd70] text-[8px] font-bold">
          {count}
        </span>
      )}
    </button>
  )
}
