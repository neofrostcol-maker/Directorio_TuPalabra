export interface CategoriaBase {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
}

export const CATEGORIAS_OFICIALES: CategoriaBase[] = [
  {
    id: 1,
    nombre: 'Comercio',
    slug: 'comercio',
    descripcion: 'Compra y venta de productos, comercio mayorista y minorista',
  },
  {
    id: 2,
    nombre: 'Comercio electrónico',
    slug: 'comercio-electronico',
    descripcion: 'Venta por internet, tiendas virtuales, marketplace',
  },
  {
    id: 3,
    nombre: 'Alimentos y bebidas',
    slug: 'alimentos-y-bebidas',
    descripcion: 'Restaurantes, comidas rápidas, cafeterías, bebidas, preparación de alimentos',
  },
  {
    id: 4,
    nombre: 'Manufactura / Producción',
    slug: 'manufactura-produccion',
    descripcion: 'Fabricación, transformación y elaboración de productos',
  },
  {
    id: 5,
    nombre: 'Servicios profesionales',
    slug: 'servicios-profesionales',
    descripcion: 'Consultoría, asesoría, ingeniería, contabilidad, servicios jurídicos',
  },
  {
    id: 6,
    nombre: 'Tecnología / Software',
    slug: 'tecnologia-software',
    descripcion: 'Desarrollo de software, programación, sistemas, servicios informáticos',
  },
  {
    id: 7,
    nombre: 'Publicidad y marketing',
    slug: 'publicidad-marketing',
    descripcion: 'Publicidad, marketing, diseño, gestión de campañas',
  },
  {
    id: 8,
    nombre: 'Construcción',
    slug: 'construccion',
    descripcion: 'Obras, remodelaciones, instalaciones',
  },
  {
    id: 9,
    nombre: 'Transporte y logística',
    slug: 'transporte-logistica',
    descripcion: 'Transporte de pasajeros, carga, mensajería, almacenamiento',
  },
  {
    id: 10,
    nombre: 'Alojamiento y turismo',
    slug: 'alojamiento-turismo',
    descripcion: 'Hoteles, hostales, alojamiento turístico y actividades turísticas',
  },
  {
    id: 11,
    nombre: 'Educación',
    slug: 'educacion',
    descripcion: 'Enseñanza, capacitación, formación',
  },
  {
    id: 12,
    nombre: 'Salud',
    slug: 'salud',
    descripcion: 'Servicios médicos, odontología, laboratorios',
  },
  {
    id: 13,
    nombre: 'Servicios personales',
    slug: 'servicios-personales',
    descripcion: 'Peluquería, belleza, cuidado personal',
  },
  {
    id: 14,
    nombre: 'Mantenimiento y reparación',
    slug: 'mantenimiento-reparacion',
    descripcion: 'Vehículos, computadores, equipos y maquinaria',
  },
  {
    id: 15,
    nombre: 'Actividades inmobiliarias',
    slug: 'actividades-inmobiliarias',
    descripcion: 'Arrendamiento, compra/venta y administración de inmuebles',
  },
  {
    id: 16,
    nombre: 'Actividades financieras',
    slug: 'actividades-financieras',
    descripcion: 'Servicios financieros, seguros e intermediación',
  },
  {
    id: 17,
    nombre: 'Agricultura y ganadería',
    slug: 'agricultura-ganaderia',
    descripcion: 'Cultivos, ganadería, producción agrícola y pecuaria',
  },
  {
    id: 18,
    nombre: 'Industria',
    slug: 'industria',
    descripcion: 'Producción industrial y transformación de materias primas',
  },
  {
    id: 19,
    nombre: 'Entretenimiento y recreación',
    slug: 'entretenimiento-recreacion',
    descripcion: 'Eventos, actividades recreativas, deportivas y culturales',
  },
  {
    id: 20,
    nombre: 'Servicios empresariales',
    slug: 'servicios-empresariales',
    descripcion: 'Administración, apoyo empresarial, outsourcing',
  },
  {
    id: 21,
    nombre: 'Telecomunicaciones',
    slug: 'telecomunicaciones',
    descripcion: 'Internet, telefonía, transmisión de datos',
  },
  {
    id: 22,
    nombre: 'Actividades ambientales',
    slug: 'actividades-ambientales',
    descripcion: 'Gestión de residuos, tratamiento de aguas, saneamiento',
  },
  {
    id: 23,
    nombre: 'Servicios de seguridad',
    slug: 'servicios-seguridad',
    descripcion: 'Vigilancia, seguridad privada',
  },
];
