export default function PageHeader({ titulo, subtitulo, accion }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-10">
      <div>
        {subtitulo && (
          <div className="text-xs tracking-[0.3em] uppercase text-[#E63946] mb-2 font-medium">
            {subtitulo}
          </div>
        )}
        <h1 className="font-serif text-4xl text-[#1D3FA8] leading-tight tracking-tight">
          {titulo}
        </h1>
      </div>
      {accion && <div className="flex-shrink-0">{accion}</div>}
    </div>
  );
}
