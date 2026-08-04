import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Réinitialisation des données…");
  await prisma.notification.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.document.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.bien.deleteMany();
  await prisma.syncLog.deleteMany();

  // ── Bien 1 : Immeuble de rapport à Liège ──────────────────
  const residence = await prisma.bien.create({
    data: {
      reference: "IMM-2024-001",
      name: "Résidence des Terrasses",
      type: "IMMEUBLE_RAPPORT",
      status: "PARTIELLEMENT_VENDU",
      address: "Rue Saint-Gilles 84",
      city: "Liège",
      postalCode: "4000",
      description:
        "Immeuble de rapport entièrement rénové au cœur de Liège. 6 unités : 4 appartements, 1 studio et 1 commerce en rez-de-chaussée. Toiture et châssis refaits en 2023.",
      price: 1_450_000,
      surface: 620,
      yearBuilt: 1962,
      coverImage:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
      units: {
        create: [
          {
            reference: "A-RDC",
            name: "Commerce RDC",
            type: "COMMERCE",
            status: "LOUE",
            floor: "Rez-de-chaussée",
            surface: 120,
            rooms: 2,
            price: 320_000,
            rentPrice: 1_800,
            epcScore: "C",
            description:
              "Surface commerciale avec vitrine sur rue, actuellement louée à un commerce de proximité (bail 9 ans).",
          },
          {
            reference: "A-101",
            name: "Appartement 1A",
            type: "APPARTEMENT",
            status: "VENDU",
            floor: "1er étage",
            surface: 95,
            rooms: 4,
            bedrooms: 2,
            bathrooms: 1,
            price: 245_000,
            epcScore: "B",
            description: "Appartement 2 chambres traversant, balcon arrière.",
          },
          {
            reference: "A-102",
            name: "Appartement 1B",
            type: "APPARTEMENT",
            status: "SOUS_COMPROMIS",
            floor: "1er étage",
            surface: 78,
            rooms: 3,
            bedrooms: 1,
            bathrooms: 1,
            price: 205_000,
            epcScore: "B",
            description: "Appartement 1 chambre lumineux, cuisine équipée.",
          },
          {
            reference: "A-201",
            name: "Appartement 2A",
            type: "APPARTEMENT",
            status: "DISPONIBLE",
            floor: "2e étage",
            surface: 98,
            rooms: 4,
            bedrooms: 2,
            bathrooms: 1,
            price: 259_000,
            epcScore: "B",
            description: "Appartement 2 chambres, dernière rénovation 2023.",
          },
          {
            reference: "A-202",
            name: "Studio 2B",
            type: "STUDIO",
            status: "DISPONIBLE",
            floor: "2e étage",
            surface: 34,
            rooms: 1,
            bedrooms: 0,
            bathrooms: 1,
            price: 118_000,
            epcScore: "C",
            description: "Studio idéal investisseur, rendement estimé 5,2 %.",
          },
          {
            reference: "A-GAR",
            name: "Garage box n°3",
            type: "GARAGE",
            status: "DISPONIBLE",
            floor: "Sous-sol",
            surface: 15,
            price: 25_000,
            description: "Box fermé au sous-sol, accès sécurisé.",
          },
        ],
      },
    },
  });

  // ── Bien 2 : Maison unifamiliale ──────────────────────────
  const maison = await prisma.bien.create({
    data: {
      reference: "MAI-2024-014",
      name: "Villa Les Ormes",
      type: "MAISON",
      status: "EN_VENTE",
      address: "Avenue des Ormes 12",
      city: "Embourg",
      postalCode: "4053",
      description:
        "Villa 4 façades sur 8 ares, 4 chambres, garage double. Quartier résidentiel calme, proche des écoles.",
      price: 595_000,
      surface: 240,
      yearBuilt: 2008,
      coverImage:
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
      units: {
        create: [
          {
            reference: "MAI-014-U1",
            name: "Habitation principale",
            type: "MAISON",
            status: "DISPONIBLE",
            surface: 240,
            rooms: 8,
            bedrooms: 4,
            bathrooms: 2,
            price: 595_000,
            epcScore: "A",
            description:
              "Vaste séjour ouvert, cuisine hyper-équipée, jardin orienté sud.",
          },
        ],
      },
    },
  });

  // ── Bien 3 : Immeuble mixte en préparation ────────────────
  const projet = await prisma.bien.create({
    data: {
      reference: "IMM-2025-003",
      name: "Le Carré Saint-Léonard",
      type: "IMMEUBLE",
      status: "EN_PREPARATION",
      address: "Rue Saint-Léonard 210",
      city: "Liège",
      postalCode: "4000",
      description:
        "Projet de réhabilitation d'un immeuble en 3 appartements + 1 entrepôt. Permis d'urbanisme en cours.",
      price: 780_000,
      surface: 410,
      yearBuilt: 1935,
      coverImage:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
      units: {
        create: [
          {
            reference: "C-101",
            name: "Appartement projeté 1",
            type: "APPARTEMENT",
            status: "INDISPONIBLE",
            floor: "1er étage",
            surface: 85,
            rooms: 3,
            bedrooms: 2,
            price: 235_000,
            description: "Sur plan — livraison estimée 2026.",
          },
          {
            reference: "C-201",
            name: "Appartement projeté 2",
            type: "APPARTEMENT",
            status: "INDISPONIBLE",
            floor: "2e étage",
            surface: 85,
            rooms: 3,
            bedrooms: 2,
            price: 240_000,
            description: "Sur plan — livraison estimée 2026.",
          },
          {
            reference: "C-ENT",
            name: "Entrepôt arrière",
            type: "ENTREPOT",
            status: "INDISPONIBLE",
            floor: "Rez-de-chaussée",
            surface: 180,
            price: 190_000,
            description: "Espace de stockage / atelier, hauteur sous plafond 4 m.",
          },
        ],
      },
    },
  });

  // ── Quelques documents & photos d'exemple ─────────────────
  await prisma.document.createMany({
    data: [
      {
        name: "PEB - Résidence des Terrasses.pdf",
        url: "https://example.com/peb.pdf",
        mimeType: "application/pdf",
        category: "PEB",
        source: "MANUAL",
        bienId: residence.id,
      },
      {
        name: "Plan cadastral.pdf",
        url: "https://example.com/plan.pdf",
        mimeType: "application/pdf",
        category: "PLAN",
        source: "MANUAL",
        bienId: residence.id,
      },
      {
        name: "Compromis - Appartement 1A.pdf",
        url: "https://example.com/compromis.pdf",
        mimeType: "application/pdf",
        category: "CONTRAT",
        source: "MANUAL",
        bienId: residence.id,
      },
    ],
  });

  // ── Notifications initiales ───────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        type: "NEW_BIEN",
        title: "Nouveau bien : Villa Les Ormes",
        message: "Ajouté au portefeuille — mise en vente à 595 000 €.",
        entityType: "BIEN",
        entityId: maison.id,
        href: `/biens/${maison.id}`,
      },
      {
        type: "STATUS_CHANGE",
        title: "Appartement 1B passé sous compromis",
        message: "Résidence des Terrasses — unité A-102.",
        entityType: "BIEN",
        entityId: residence.id,
        href: `/biens/${residence.id}`,
        read: true,
      },
      {
        type: "NEW_DOCUMENT",
        title: "3 documents ajoutés",
        message: "PEB, plan cadastral et compromis — Résidence des Terrasses.",
        entityType: "BIEN",
        entityId: residence.id,
        href: `/biens/${residence.id}`,
      },
    ],
  });

  console.log("✅ Données de démonstration créées :");
  console.log(`   • ${residence.name} (6 unités)`);
  console.log(`   • ${maison.name} (1 unité)`);
  console.log(`   • ${projet.name} (3 unités)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
