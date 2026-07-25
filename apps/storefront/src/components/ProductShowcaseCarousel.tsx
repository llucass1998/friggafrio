import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const slides = [
  {
    title: "Tubos e Isolamentos",
    description: "Materiais para proteção térmica e instalação de sistemas de refrigeração.",
    image: "/images/carousel/carousel-isolamentos.webp",
    link: "/produtos"
  },
  {
    title: "Gases Refrigerantes",
    description: "Soluções para diferentes aplicações de refrigeração comercial, industrial e doméstica.",
    image: "/images/carousel/carousel-gases-refrigerantes.webp",
    link: "/produtos"
  },
  {
    title: "Cilindros para Recolhimento",
    description: "Equipamentos para recolhimento e armazenamento técnico de fluidos refrigerantes.",
    image: "/images/carousel/carousel-cilindros-recolhimento.webp",
    link: "/produtos"
  },
  {
    title: "Tubos de Cobre",
    description: "Materiais para instalações e manutenção de sistemas frigoríficos.",
    image: "/images/carousel/carousel-tubos-cobre.webp",
    link: "/produtos"
  },
  {
    title: "Ferramentas para Refrigeração",
    description: "Bombas de vácuo, manifolds e ferramentas para instalação e manutenção.",
    image: "/images/carousel/carousel-ferramentas.webp",
    link: "/produtos"
  }
];

export function ProductShowcaseCarousel() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent(c => (c === 0 ? slides.length - 1 : c - 1));
  const next = () => setCurrent(c => (c === slides.length - 1 ? 0 : c + 1));

  return (
    <div 
      className="relative w-full h-[340px] sm:h-[420px] lg:h-[500px] xl:h-[620px] overflow-hidden bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500"
      aria-roledescription="carousel"
      aria-label="Destaques da loja"
    >
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, index) => {
          const isActive = index === current;
          return (
            <div 
              key={index} 
              className="w-full flex-shrink-0 relative h-full"
              aria-roledescription="slide"
              aria-hidden={!isActive}
            >
              <img 
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-blue-900/30 flex flex-col justify-end p-6 md:p-12">
                <div className="max-w-3xl">
                  <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4 drop-shadow-md">
                    {slide.title}
                  </h2>
                  <p className="text-sm md:text-lg text-white mb-4 md:mb-6 drop-shadow-md">
                    {slide.description}
                  </p>
                  <Link 
                    to={slide.link} 
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
                    tabIndex={isActive ? 0 : -1}
                  >
                    Ver Categoria
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Slide anterior"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>

      <button 
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Próximo slide"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Ir para o slide ${index + 1}`}
            aria-current={index === current}
            className={clsx(
              "w-3 h-3 rounded-full transition-colors min-w-[44px] min-h-[20px] focus:outline-none focus:ring-2 focus:ring-white",
              index === current ? "bg-white" : "bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
