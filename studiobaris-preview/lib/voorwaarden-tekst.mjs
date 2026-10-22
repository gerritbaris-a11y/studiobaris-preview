// Algemene voorwaarden StudioBaris — de ENIGE bron van de tekst.
// Gebruikt door de pagina /voorwaarden (waar de klant bij akkoord naar linkt)
// en door scripts/voorwaarden-pdf.mjs (de pdf in Documenten). Pas de tekst
// alleen hier aan, verhoog dan VERSIE en DATUM en maak de pdf opnieuw.

export const VERSIE = "1.0";
export const DATUM = "22 oktober 2026";

export const BEDRIJF = {
  naam: "StudioBaris",
  adres: "Hooigracht 63, 2312 KP Leiden",
  kvk: "42128377",
  email: "info@studiobaris.nl",
  telefoon: "06 16 73 21 05",
  website: "studiobaris.nl",
};

export const INLEIDING =
  "StudioBaris, gevestigd aan de Hooigracht 63, 2312 KP Leiden, ingeschreven bij de Kamer van Koophandel onder nummer 42128377 (“wij”, “Leverancier”), ontwerpt, bouwt, host en onderhoudt websites voor ondernemers, met daarbij de StudioBaris-app. Deze voorwaarden gelden voor elke offerte, opdrachtbevestiging en overeenkomst tussen Leverancier en de opdrachtgever (“Klant”).";

// Elk artikel: titel + leden. Een lid is een string, of { lijst: [...] } voor
// een opsomming, of { term, uitleg } binnen een definitielijst.
export const ARTIKELEN = [
  {
    titel: "Definities",
    definities: [
      { term: "Website", uitleg: "de website die Leverancier voor Klant ontwerpt, bouwt en oplevert." },
      { term: "Preview", uitleg: "de gratis voorbeeldversie van de Website die Leverancier vóór de opdracht toont. Deze is opgesteld op basis van aannames en openbaar beschikbare gegevens en is uitdrukkelijk indicatief." },
      { term: "Demo-app", uitleg: "de gratis proefversie van de App die bij de Preview hoort." },
      { term: "App", uitleg: "de StudioBaris-app waarmee Klant zelf projecten en reviews op de Website plaatst, inclusief de software op de Website die deze toont (de plugin)." },
      { term: "Opstartvergoeding", uitleg: "de eenmalige vergoeding voor het ontwerp, de bouw en de oplevering van de Website." },
      { term: "Abonnement", uitleg: "de doorlopende dienst voor hosting, het technisch beheer van het domein, e-mail, het gebruik van de App, beveiliging en onderhoud." },
      { term: "Maandelijkse vergoeding", uitleg: "de vergoeding voor het Abonnement." },
      { term: "Opdrachtbevestiging", uitleg: "de digitale bevestiging (via de akkoord- en betaalpagina van Leverancier of anderszins schriftelijk) waarin de afgesproken diensten, tarieven en gegevens zijn vastgelegd." },
      { term: "Oplevering", uitleg: "het moment waarop de Website live wordt gezet en als opgeleverd geldt (artikel 8)." },
      { term: "Meerwerk", uitleg: "werkzaamheden die buiten de overeengekomen opdracht en buiten de inbegrepen correctierondes vallen." },
    ],
  },
  {
    titel: "Toepasselijkheid en zakelijk karakter",
    leden: [
      "Deze voorwaarden gelden voor alle overeenkomsten met Leverancier. Afwijkingen gelden alleen als ze schriftelijk zijn overeengekomen. Inkoopvoorwaarden van Klant worden uitdrukkelijk van de hand gewezen.",
      "Klant gaat de overeenkomst aan in de uitoefening van een beroep of bedrijf. De Website, de App en de diensten zijn uitsluitend bestemd voor zakelijk gebruik.",
      "Omdat Klant niet handelt als consument, heeft Klant geen wettelijk herroepingsrecht of wettelijke bedenktijd.",
      "Klant verklaart deze voorwaarden vóór het aangaan van de overeenkomst te hebben kunnen lezen.",
    ],
  },
  {
    titel: "Preview, Demo-app en totstandkoming van de overeenkomst",
    leden: [
      "De Preview en de Demo-app zijn gratis en vrijblijvend. Ze binden Leverancier niet wat betreft de definitieve inhoud van de Website.",
      "De Demo-app is 30 dagen actief. Klant kan daarin zelf maximaal 3 projecten plaatsen. Komt er geen overeenkomst tot stand, dan mag Leverancier de Preview en de Demo-app met de daarin geplaatste projecten verwijderen.",
      "De overeenkomst komt tot stand op het moment dat Klant de Opdrachtbevestiging digitaal accepteert, waarbij Klant akkoord gaat met deze voorwaarden.",
      "Leverancier legt vast met welke versie van deze voorwaarden Klant akkoord is gegaan, en wanneer.",
    ],
  },
  {
    titel: "Prijzen en betaling",
    leden: [
      "De vergoedingen bestaan uit (a) de eenmalige Opstartvergoeding en (b) de Maandelijkse vergoeding voor het Abonnement. De geldende bedragen staan in de Opdrachtbevestiging. Alle bedragen zijn in euro’s en exclusief btw, tenzij anders vermeld.",
      "In het Abonnement zijn twee e-mailadressen (mailboxen) inbegrepen. Elke extra mailbox kost thans € 4,95 per maand.",
      "De helft van de Opstartvergoeding is verschuldigd bij het aangaan van de overeenkomst, samen met de eerste Maandelijkse vergoeding. De andere helft is verschuldigd bij Oplevering.",
      "Betaling verloopt via betaaldienstverlener Mollie. Met de eerste betaling geeft Klant tevens een doorlopende SEPA-machtiging, waarmee de Maandelijkse vergoeding automatisch wordt geïncasseerd.",
      "Het Abonnement en de facturatie daarvan starten bij het aangaan van de overeenkomst, ook als Klant op dat moment nog niet alle gegevens of content heeft aangeleverd.",
      "Het uurtarief voor Meerwerk bedraagt thans € 75 per uur.",
      "Leverancier mag de tarieven jaarlijks indexeren en andere tariefwijzigingen doorvoeren, met een aankondiging van ten minste één maand vooraf.",
      "Bij niet-tijdige betaling is Klant van rechtswege in verzuim. Leverancier mag dan de dienstverlening opschorten en de Website na een betalingsherinnering (tijdelijk) offline halen. Vanaf het verzuim is Klant de wettelijke handelsrente (artikel 6:119a BW) en de buitengerechtelijke incassokosten verschuldigd.",
    ],
  },
  {
    titel: "Uitvoering en correctierondes",
    leden: [
      "De eerste versie van de Website wordt opgesteld op basis van de Preview, aannames en de door Klant aangeleverde gegevens.",
      "Bij de opdracht zijn twee correctierondes inbegrepen: één op de eerste versie, en één na Oplevering.",
      "Een correctieronde omvat tekstuele aanpassingen, het wisselen van kleuren of afbeeldingen en het ordenen van bestaande onderdelen binnen het gekozen sjabloon.",
      "Buiten de correctierondes vallen onder meer nieuwe pagina’s, structurele wijzigingen, nieuwe functionaliteit en herhaalde wijzigingen op al goedgekeurde onderdelen. Dit is Meerwerk tegen het uurtarief.",
      "Klant levert de feedback per ronde gebundeld aan binnen 10 werkdagen. Komt er binnen die termijn geen feedback, dan geldt de betreffende versie als goedgekeurd.",
    ],
  },
  {
    titel: "Aanlevering en verantwoordelijkheid van Klant",
    leden: [
      "Klant levert de benodigde teksten, beeldmateriaal en gegevens tijdig aan.",
      "Klant staat ervoor in dat hij het aangeleverde en via de App geplaatste materiaal mag gebruiken, en dat de inhoud (waaronder claims over diensten en prijzen) juist en niet misleidend is.",
      "Klant controleert de teksten, claims, prijzen en gegevens op de Website op juistheid en volledigheid. Met de goedkeuring bij Oplevering, of het ongebruikt verstrijken van de feedbacktermijn, aanvaardt Klant de inhoud van de Website.",
      "Klant vrijwaart Leverancier tegen aanspraken van derden die voortvloeien uit door Klant aangeleverde, goedgekeurde of via de App geplaatste inhoud, waaronder inbreuk op intellectuele-eigendoms- of privacyrechten.",
    ],
  },
  {
    titel: "Door Leverancier geleverde content en beeldmateriaal",
    leden: [
      "Leverancier kan voor ontwerp en teksten gebruikmaken van geautomatiseerde hulpmiddelen, waaronder AI-tools. Zulke content is een voorstel; de controle op juistheid blijft bij Klant (artikel 6).",
      "Door Leverancier geleverde stockafbeeldingen of andere media van derden worden gebruikt onder de betreffende licentie. Klant krijgt daarop geen eigendom en gebruikt ze alleen binnen de Website. Op verzoek vervangt Leverancier ze door eigen materiaal van Klant.",
    ],
  },
  {
    titel: "Oplevering",
    leden: [
      "De Website geldt als opgeleverd zodra zij live staat en Klant akkoord heeft gegeven, of de feedbacktermijn ongebruikt is verstreken.",
      "Na de correctieronde na Oplevering (artikel 5.2) is elke verdere wijziging door Leverancier Meerwerk tegen het uurtarief. Wat Klant zelf via de App plaatst, valt daar niet onder.",
    ],
  },
  {
    titel: "Domein, hosting, e-mail en onderhoud",
    leden: [
      "Klant blijft eigenaar van zijn domeinnaam. De Website en de e-mail draaien op de hosting van Leverancier, en Leverancier verzorgt het technisch beheer van het domein.",
      "Onder het Abonnement vallen hosting, het technisch beheer van het domein, e-mail volgens artikel 4.2, beveiligings- en software-updates, periodieke back-ups en een redelijke beschikbaarheid van de Website.",
      "Leverancier streeft naar een redelijke beschikbaarheid, maar garandeert geen beschikbaarheid (uptime) of service level, tenzij schriftelijk anders afgesproken.",
      "Storingen buiten de invloed van Leverancier, zoals storingen bij toeleveranciers, vallen buiten zijn verantwoordelijkheid.",
      "Leverancier plaatst bij Oplevering een privacyverklaring en een cookiemelding op de Website, op basis van de gegevens van Klant. Klant blijft verantwoordelijk voor de juistheid daarvan en voor wat zijn eigen bedrijfsvoering verder wettelijk vereist.",
    ],
  },
  {
    titel: "De App",
    leden: [
      "Met de App plaatst Klant zelf projecten en reviews op de Website. Wat Klant plaatst, staat binnen enkele minuten op de Website.",
      "Klant krijgt een persoonlijke inloglink. Die werkt als een wachtwoord: Klant deelt hem niet met anderen en is verantwoordelijk voor wat er via zijn inloglink gebeurt.",
      "Per dag kan Klant maximaal twee projecten plaatsen en twee reviewverzoeken versturen.",
      "Teksten die de App met AI voorstelt, zijn een voorstel. Klant controleert ze voordat hij plaatst.",
      "De App en de software op de Website die haar toont, zijn en blijven eigendom van Leverancier. Klant krijgt een gebruiksrecht zolang het Abonnement loopt en de Website op de hosting van Leverancier staat. De App wordt niet los geleverd.",
      "Bij beëindiging van het Abonnement, of als de Website naar een andere hostingpartij verhuist, wordt de App gedeactiveerd.",
    ],
  },
  {
    titel: "Intellectueel eigendom",
    leden: [
      "Na volledige betaling van de Opstartvergoeding gaan de auteursrechten op het specifiek voor Klant gemaakte ontwerp en de teksten van de Website over op Klant.",
      "De onderliggende software, sjablonen, de App en door Leverancier geleverde media van derden blijven eigendom van Leverancier of de betreffende rechthebbende. Klant krijgt daarop alleen een gebruiksrecht zoals in de artikelen 7 en 10 staat.",
    ],
  },
  {
    titel: "Looptijd, opzegging en beëindiging",
    leden: [
      "Het Abonnement heeft een minimale looptijd van 12 maanden, omdat Leverancier de hosting en het domein voor minimaal een jaar vastlegt.",
      "Na de minimale looptijd loopt het Abonnement voor onbepaalde tijd door en is het maandelijks opzegbaar met een opzegtermijn van één maand. Het wordt niet stilzwijgend verlengd met een nieuwe vaste termijn.",
      "Opzeggen binnen de minimale looptijd is niet mogelijk. Zegt Klant toch tussentijds op, of eindigt de overeenkomst tussentijds door toedoen van Klant, dan blijven de Maandelijkse vergoedingen tot het einde van de minimale looptijd verschuldigd. De Opstartvergoeding wordt niet terugbetaald.",
      "Leverancier mag de overeenkomst geheel of gedeeltelijk met onmiddellijke ingang opschorten of ontbinden als Klant, ondanks een ingebrekestelling, tekortschiet, of bij faillissement, surseance van betaling of een aanvraag daartoe.",
      "Bij beëindiging levert Leverancier op verzoek een export van de inhoud van de Website en de verhuiscode van het domein, binnen 10 werkdagen na de laatste betaling.",
      "Bij beëindiging wordt de App gedeactiveerd (artikel 10.6).",
    ],
  },
  {
    titel: "Persoonsgegevens",
    leden: [
      "Partijen houden zich aan de Algemene verordening gegevensbescherming (AVG).",
      "Voor zover Leverancier persoonsgegevens verwerkt namens Klant (bijvoorbeeld via het contactformulier, de App, reviews of e-mail), is Klant verwerkingsverantwoordelijke en Leverancier verwerker. De afspraken daarover staan in de Verwerkersovereenkomst in de bijlage bij deze voorwaarden; die maakt deel uit van de overeenkomst.",
    ],
  },
  {
    titel: "Klachten",
    leden: [
      "Klant meldt zichtbare gebreken binnen 10 werkdagen na Oplevering en andere gebreken binnen 10 werkdagen na ontdekking, schriftelijk en duidelijk omschreven.",
      "Een klacht schort de betalingsverplichting van Klant niet op.",
      "Bij een tijdige en terechte klacht herstelt Leverancier het gebrek binnen een redelijke termijn.",
    ],
  },
  {
    titel: "Aansprakelijkheid",
    leden: [
      "De aansprakelijkheid van Leverancier is beperkt tot het bedrag dat Klant in de twaalf maanden vóór de schadeveroorzakende gebeurtenis aan Leverancier heeft betaald.",
      "Leverancier is niet aansprakelijk voor indirecte schade, waaronder gederfde omzet en gevolgschade.",
      "Deze beperkingen gelden niet bij opzet of bewuste roekeloosheid van Leverancier.",
    ],
  },
  {
    titel: "Overmacht",
    leden: [
      "Leverancier hoeft zijn verplichtingen niet na te komen bij overmacht, waaronder storingen bij toeleveranciers, internet- of stroomuitval en cyberaanvallen.",
    ],
  },
  {
    titel: "Wijziging van de voorwaarden",
    leden: [
      "Leverancier mag deze voorwaarden wijzigen. Wijzigingen worden ten minste één maand vooraf aangekondigd en gelden voor lopende abonnementen vanaf de aangekondigde ingangsdatum.",
    ],
  },
  {
    titel: "Toepasselijk recht en geschillen",
    leden: [
      "Op alle overeenkomsten is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement Den Haag.",
    ],
  },
];

// Bijlage: Verwerkersovereenkomst (artikel 13).
export const BIJLAGE = {
  titel: "Bijlage — Verwerkersovereenkomst",
  intro:
    "Deze verwerkersovereenkomst hoort bij de algemene voorwaarden van StudioBaris en geldt tussen Klant (verwerkingsverantwoordelijke) en Leverancier (verwerker). Begrippen hebben de betekenis uit de AVG.",
  artikelen: [
    {
      titel: "Waarvoor Leverancier gegevens verwerkt",
      leden: [
        "Leverancier verwerkt persoonsgegevens alleen om de Website, de App en de e-mail van Klant te laten werken: bewaren, tonen op de Website en beveiligen. Leverancier gebruikt de gegevens nergens anders voor en verkoopt of deelt ze niet.",
        "Het gaat om gegevens van klanten en contactpersonen van Klant, zoals naam, e-mailadres, telefoonnummer, berichten via het contactformulier, reviews en de inhoud van e-mail, en om gegevens die Klant zelf in projecten plaatst.",
        "Leverancier volgt de redelijke instructies van Klant. Vindt Leverancier een instructie in strijd met de wet, dan meldt hij dat.",
      ],
    },
    {
      titel: "Beveiliging en geheimhouding",
      leden: [
        "Leverancier neemt passende technische en organisatorische maatregelen om de gegevens te beveiligen, waaronder versleutelde verbindingen (SSL), beperkte toegang, updates en back-ups.",
        "Iedereen die namens Leverancier toegang heeft tot de gegevens, is tot geheimhouding verplicht.",
      ],
    },
    {
      titel: "Subverwerkers",
      leden: [
        "Klant geeft toestemming voor het inschakelen van de volgende subverwerkers:",
        { lijst: [
          "Esmero — hosting van de Website en e-mail",
          "Supabase — database en opslag van de App (servers in de EU, Frankfurt)",
          "Vercel — hosting van de App",
          "Anthropic — het voorstellen van projectteksten in de App",
          "Resend — het versturen van e-mail vanuit de App",
          "Mollie — betalingen en incasso",
        ] },
        "Leverancier legt deze subverwerkers dezelfde plichten op als in deze overeenkomst. Een nieuwe subverwerker meldt Leverancier vooraf; Klant kan daar binnen een redelijke termijn met redenen bezwaar tegen maken.",
        "Waar een subverwerker gegevens buiten de Europese Economische Ruimte verwerkt, gebeurt dat alleen met de waarborgen die de AVG vereist.",
      ],
    },
    {
      titel: "Datalekken",
      leden: [
        "Leverancier meldt een inbreuk op de beveiliging die de gegevens van Klant raakt (datalek) zonder onredelijke vertraging aan Klant, met de informatie die Klant nodig heeft om binnen 72 uur aan zijn eigen meldplicht te voldoen.",
      ],
    },
    {
      titel: "Rechten van betrokkenen en medewerking",
      leden: [
        "Vraagt iemand inzage, correctie of verwijdering van zijn gegevens, dan helpt Leverancier Klant daarbij voor zover redelijk.",
        "Leverancier geeft Klant op verzoek de informatie die nodig is om aan te tonen dat deze overeenkomst wordt nageleefd.",
      ],
    },
    {
      titel: "Einde",
      leden: [
        "Deze verwerkersovereenkomst loopt zolang Leverancier gegevens voor Klant verwerkt.",
        "Na beëindiging van het Abonnement verwijdert Leverancier de gegevens, nadat Klant de gelegenheid heeft gehad een export op te vragen (artikel 12.5 van de voorwaarden), tenzij een wettelijke plicht tot bewaren geldt.",
      ],
    },
  ],
};
