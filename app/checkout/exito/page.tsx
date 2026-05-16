import Link from "next/link";

export default async function ExitoPage({ searchParams }: { searchParams: Promise<{ numero?: string }> }) {
  const { numero } = await searchParams;
  return (
    <div className="container-dp py-20 text-center min-h-[60vh]">
      <div className="text-7xl mb-6 anim-scale">🎉</div>
      <div className="divider-fancy mb-4 justify-center" style={{ width: "fit-content", margin: "0 auto 1rem" }}>
        <span>Pedido recibido</span>
      </div>
      <h1 className="font-serif text-4xl md:text-5xl text-[#0F1E3F] mb-4">
        ¡Pedido <span className="italic text-[#E63946]">confirmado!</span>
      </h1>
      <p className="text-[#0F1E3F]/60 mb-2">Tu número de pedido es:</p>
      <p className="font-mono font-extrabold text-3xl md:text-4xl text-[#E63946] mb-8 tracking-wider">{numero}</p>
      <p className="text-[#0F1E3F]/60 max-w-md mx-auto mb-10">
        Te contactaremos por WhatsApp para confirmar la entrega y el pago. Gracias por confiar en Distripollo La 94 🐔
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/productos" className="bg-[#E63946] hover:bg-[#C72D3B] text-white font-semibold px-6 py-3 rounded-full transition-all hover:scale-105">
          Seguir comprando
        </Link>
        <a href="https://wa.me/573054223600" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:bg-[#1FAE52] text-white font-semibold px-6 py-3 rounded-full transition-all hover:scale-105">
          💬 WhatsApp
        </a>
      </div>
    </div>
  );
}
