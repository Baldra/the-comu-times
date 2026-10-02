/* The Comu Times — content data. GENERATED FILE, DO NOT EDIT.
 *
 * Regenerate with:  python3 scripts/build-data.py
 *
 * Source of truth for the ranking, vote counts and voter lists:
 *   data/survey/*.csv        the committed survey snapshot
 * Source of truth for the editorial copy:
 *   data/annotations.json    year, director, bilingual title and blurb
 *   data/copy.json           topper, interface strings, movement copy
 *
 * Loaded as a plain script before app.js so the page works from file://
 * without a server. Global `window.SECTIONS` / `window.MOVIES` rather than
 * a JSON fetch, because fetch() of a local file is blocked by CORS on the
 * file: protocol.
 */
(function () {
  'use strict';

  window.LOCALES = ["es", "en"];
  window.DEFAULT_LOCALE = "en";

  /* ------------------------------------------------------------- topper */

  window.TOPPER = {
    "headline": {
      "es": ["VEINTE PELÍCULAS", "ELEGIDAS POR", "SESENTA Y SEIS PERSONAS"],
      "en": ["TWENTY FILMS", "PICKED BY", "SIXTY-SIX OF YOU"]
    },
    "standfirst": {
      "es": "Sesenta y seis personas emitieron 593 votos: sesenta y cinco eligieron nueve películas cada una y una eligió ocho. Veinte películas fueron elegidas por al menos cuatro personas. Acá están, de la vigésima a la primera.",
      "en": "Sixty-six people cast 593 picks between them: sixty-five chose nine films each, and one chose eight. Twenty films were chosen by at least four people. Here they are, twentieth to first."
    }
  };

  /* ---------------------------------------------------------- interface */

  window.COPY = {
    "wordmark": "The Comu Times",
    "skipToContent": {
      "es": "Ir al contenido",
      "en": "Skip to content"
    },
    "languageLabel": {
      "es": "Idioma",
      "en": "Language"
    },
    "jumpLabel": {
      "es": "Ir a la posición",
      "en": "Jump to rank"
    },
    "listHeading": {
      "es": "La lista completa",
      "en": "The complete list"
    },
    "listIntro": {
      "es": "Veinte películas, ordenadas de la vigésima a la primera. El puesto se cuenta desde la ganadora y las películas con la misma cantidad de votos van en orden alfabético, no como preferencia medida.",
      "en": "Twenty films, ordered from twentieth to first. Rank is counted from the winner, and films sharing a vote count sit in alphabetical order — not a measured preference."
    },
    "movementWord": {
      "es": "Movimiento",
      "en": "Movement"
    },
    "movementEmpty": {
      "es": "Ninguna película cae en este movimiento.",
      "en": "No films fall into this movement."
    },
    "counterSeen": {
      "es": "vistas",
      "en": "seen"
    },
    "counterWant": {
      "es": "queridas",
      "en": "wanted"
    },
    "ofTotal": {
      "es": "de",
      "en": "of"
    },
    "seen": {
      "es": "La vi",
      "en": "Seen"
    },
    "want": {
      "es": "La quiero ver",
      "en": "Want to watch"
    },
    "seenShort": {
      "es": "Vista",
      "en": "Seen"
    },
    "wantShort": {
      "es": "Quiero ver",
      "en": "Want"
    },
    "watchlistPanelTitle": {
      "es": "Tu watchlist",
      "en": "Your watchlist"
    },
    "watchlistSaved": {
      "es": "Tu watchlist está guardada",
      "en": "Your watchlist has been saved"
    },
    "watchlistEmpty": {
      "es": "Todavía no marcaste nada. Usá los controles de cada película para armar tu lista.",
      "en": "You have not marked anything yet. Use the controls on each film to build your list."
    },
    "watchlistState": {
      "es": "Estado",
      "en": "State"
    },
    "placeholderNote": {
      "es": "Todavía sin imagen",
      "en": "No image yet"
    },
    "mediaFallbackNote": {
      "es": "No pudimos cargar el archivo, mostramos el marcador de posición.",
      "en": "We could not load the file, so we are showing the placeholder."
    },
    "footerNote": {
      "es": "Una lista que no necesita justificarse.",
      "en": "A list that does not need justifying."
    },
    "votesLabel": {
      "es": "votos",
      "en": "votes"
    },
    "votersToggle": {
      "es": "Quién la eligió",
      "en": "Who picked it"
    },
    "surveyTotals": {
      "es": "66 personas · 593 votos",
      "en": "66 people · 593 picks"
    },
    "movementVotesEach": {
      "es": "votos cada una",
      "en": "votes each"
    },
    "movementVotesList": {
      "es": "votos",
      "en": "votes"
    }
  };

  /* ----------------------------------------------------------- movements */

  /* Movements are derived from the vote bands in the snapshot. Numeral, n and
   * counts are generated; only the editorial copy is authored, in
   * data/copy.json. Movements render in n order and the entry holding rank 1
   * is the last of them, so the winner stays at the foot of the page. */

  window.SECTIONS = [
    {
      "n": 1,
      "num": "I",
      "counts": [4],
      "title": {
        "es": "LA ORILLA",
        "en": "THE EDGE"
      },
      "quote": {
        "es": "Nueve películas con la misma cantidad de votos.",
        "en": "Nine films with the same number of votes."
      },
      "lede": {
        "es": "Ordenadas alfabéticamente, porque nadie las ordenó de otra forma.",
        "en": "Alphabetical, because nobody ordered them any other way."
      }
    },
    {
      "n": 2,
      "num": "II",
      "counts": [5],
      "title": {
        "es": "EL ARRANQUE",
        "en": "THE START"
      },
      "quote": {
        "es": "Tres películas con cinco votos.",
        "en": "Three films with five votes."
      },
      "lede": {
        "es": "El borde de arriba del filo.",
        "en": "The upper lip of the cliff."
      }
    },
    {
      "n": 3,
      "num": "III",
      "counts": [6],
      "title": {
        "es": "LA MAYORÍA",
        "en": "THE MAJORITY"
      },
      "quote": {
        "es": "Cinco películas con seis votos.",
        "en": "Five films with six votes."
      },
      "lede": {
        "es": "Un voto por encima de la banda de al lado.",
        "en": "One vote above the band beside it."
      }
    },
    {
      "n": 4,
      "num": "IV",
      "counts": [9, 8, 7],
      "title": {
        "es": "LAS QUE GANARON",
        "en": "THE ONES WHO WON"
      },
      "quote": {
        "es": "Tres películas, y sólo una llegó a nueve votos.",
        "en": "Three films, and only one reached nine votes."
      },
      "lede": {
        "es": "La primera de todas está al pie de esta página.",
        "en": "The first of them all sits at the foot of this page."
      }
    }
  ];

  /* ---------------------------------------------------------------- movies */

  /* Entries ship with no `media` and no `links`, so the placeholder path is
   * what the page demonstrates on first load. Both keys are honoured when
   * authored:
   *   media: 'assets/img/x.jpg'                     -> chosen by extension
   *   media: { src: 'assets/video/x.mp4', poster: 'assets/img/x.jpg' }
   *   links: [{ label: { es, en }, url: 'https://...' }] */

  window.MOVIES = [
    {
      "rank": 1,
      "section": 4,
      "votes": 9,
      "voters": ["ceroChotocientos", "HappyOreo", "Guille03", "MonoJob", "Cami Romero", "RobinStark", "Giuly", "milasconfritasss", "Mar —"],
      "year": 2004,
      "director": "Andrew Adamson, Jennifer Lee",
      "title": {
        "es": "Shrek 2",
        "en": "Shrek 2"
      },
      "blurb": {
        "es": "La que convirtió un cuento de hadas en una comedia de oficina. Los padres de Fiona, una cárcel, una burra con rencor: la premisa no tiene sentido y la duración se sostiene entera sobre los chistes. Es el primer lugar de esta lista y la única película en la que todos aquí pudieron ponerse de acuerdo.",
        "en": "The one that made a fairy tale into a workplace comedy. Fiona's parents, a prison, a donkey with a grudge — the premise is nonsense and the running time is entirely on the jokes. It is the top of this list and the only film everybody here could agree on."
      }
    },
    {
      "rank": 2,
      "section": 4,
      "votes": 8,
      "voters": ["Colorado", "JohannabeSwan", "Sr_Veron", "melgloom", "Moranna75", "Mar —", "Dirk", "Jesúsr"],
      "year": 2003,
      "director": "Bong Joon-ho",
      "title": {
        "es": "Crónica de un asesino en serie",
        "en": "Memories of Murder"
      },
      "blurb": {
        "es": "Dos detectives con métodos incompatibles persiguen a un asesino que le hace lo mismo a cada víctima. Bong convierte un policial en algo mucho más triste: un pueblo de provincia haciendo cuentas sobre sus propias desapariciones y acertando la respuesta equivocada, año por año.",
        "en": "Detectives with incompatible methods chase a killer who does the same thing twice to every victim. Bong turns a police procedural into something much sadder: a provincial town doing arithmetic on its own disappearances and getting the answer wrong, one year at a time."
      }
    },
    {
      "rank": 3,
      "section": 4,
      "votes": 7,
      "voters": ["Guille03", "aimu98", "MonoJob", "Cami Romero", "Berchumess", "AliceEncadenada", "Dirk"],
      "year": 1972,
      "director": "Luis Buñuel",
      "title": {
        "es": "Esperando la carroza",
        "en": "The Discreet Charm of the Bourgeoisie"
      },
      "blurb": {
        "es": "Seis amigos que no dejan de cenar juntos intentan, una y otra vez, atravesar una comida sin que el mundo se meta. Buñuel arma la película entera con comidas que se desarman, y los escombros son más graciosos que la comida. También es la única de esta lista que no se explica.",
        "en": "Six friends who cannot stop having dinner together try, over and over, to get through a meal without the world intruding. Buñuel builds the whole film out of meals that fall apart, and the ruins are funnier than the meal. It is also the only film here that will not explain itself."
      }
    },
    {
      "rank": 4,
      "section": 3,
      "votes": 6,
      "voters": ["aimu98", "Roma", "Merrcedes", "junines", "Dirk", "Jesúsr"],
      "year": 1988,
      "director": "Giuseppe Tornatore",
      "title": {
        "es": "Cinema Paradiso",
        "en": "Cinema Paradiso"
      },
      "blurb": {
        "es": "Un director conocido vuelve a la cabina de proyección del pueblo donde creció y recuerda al hombre que la llevaba. Tornatore arma el final con la única cosa que el viejo proyeccionista no podía hacer, que era soltar la película que estaba por destruir, y funciona siempre.",
        "en": "A famous director goes back to the village projection booth he grew up in and remembers the man who ran it. Tornatore builds the ending out of the one thing the old projectionist could not do, which is let go of the film he was about to destroy, and it lands every time."
      }
    },
    {
      "rank": 5,
      "section": 3,
      "votes": 6,
      "voters": ["HappyOreo", "Vicx", "kronos__420", "anymor26", "Sandoblah", "Merrcedes"],
      "year": 2009,
      "director": "Henry Selick",
      "title": {
        "es": "Coraline",
        "en": "Coraline"
      },
      "blurb": {
        "es": "La otra puerta tiene un botón para los ojos y una versión de tu familia que de verdad te presta atención. Es animación en plasticina, así que cada cuadro del Otro Mundo es un objeto físico que alguien construyó. Lo que asusta no es el Otro Mundo: son sus padres.",
        "en": "The other door has a button for your eyes and a version of your family that actually pays attention. Stop-motion, so every frame of the Other World is a physical object somebody built. The scary part is not the Other World; it is her parents."
      }
    },
    {
      "rank": 6,
      "section": 3,
      "votes": 6,
      "voters": ["hadafantastica", "Sandoblah", "Lola Landa", "junines", "EMA", "Jesúsr"],
      "year": 2016,
      "director": "Damien Chazelle",
      "title": {
        "es": "La La Land",
        "en": "La La Land"
      },
      "blurb": {
        "es": "El final son cinco minutos de discusión sobre si el último plano es feliz, y es la única película de esta encuesta donde el desacuerdo es justamente el punto. Todo lo anterior es un musical que confía en que le sigas, y el atasco es la mejor secuencia de la película.",
        "en": "The ending is a five-minute argument about whether the last shot is a happy one, and it is the only film in this survey where the disagreement is the point. Everything before it is a musical that trusts you to keep up, and the traffic jam is the best sequence in it."
      }
    },
    {
      "rank": 7,
      "section": 3,
      "votes": 6,
      "voters": ["Cande Mazzini", "Aioria Kimera", "Baldra", "Moranna75", "tuto", "Roxa9874"],
      "year": 2003,
      "director": "Park Chan-wook",
      "title": {
        "es": "Oldboy",
        "en": "Oldboy"
      },
      "blurb": {
        "es": "Quince años en una habitación de la que no puede salir, y un motivo para averiguar por qué, que es la entrada a una historia que en realidad habla de la rabia y de quién puede apuntarla. Park filma la pelea del pasillo de un solo plano porque el personaje no puede dejar de ser seguido, no porque una toma sea una proeza.",
        "en": "Fifteen years in a room he cannot leave, and a reason to find out why, which is the setup for a story that is really about rage and who gets to aim it. Park builds the hallway fight as one unbroken shot because the character cannot stop being followed, not because one take is a flex."
      }
    },
    {
      "rank": 8,
      "section": 3,
      "votes": 6,
      "voters": ["Colorado", "Churrasquinho", "Costita", "tuto", "Jesúsr", "Rick"],
      "year": 2004,
      "director": "Sam Raimi",
      "title": {
        "es": "Spider-Man 2",
        "en": "Spider-Man 2"
      },
      "blurb": {
        "es": "Una de las dos únicas secuelas de esta lista, y el argumento de que la mejor de la saga es la que el héroe deja de querer el trabajo. La secuencia del tren elevado es lo más divertido del cine de superhéroes, y la escena en la que suelta la máscara no va de responsabilidad: va de cansancio.",
        "en": "One of only two sequels here, and the argument that the best one in the series is the one where the hero stops wanting the job. The elevated train sequence is the most enjoyable thing in comic-book cinema, and the scene where he gives up the mask is not about responsibility — it is about being tired."
      }
    },
    {
      "rank": 9,
      "section": 2,
      "votes": 5,
      "voters": ["anymor26", "melgloom", "RobinStark", "Papita Komi", "Giuly"],
      "year": 1998,
      "director": "Barry Cook, Tony Bancroft",
      "title": {
        "es": "Mulan",
        "en": "Mulan"
      },
      "blurb": {
        "es": "La película animada de 1998, no la nueva de 2020. Los objetos pequeños del hogar se portan como caballos, que parece un chiste de usar y desde entonces resulta toda una teoría de la personalidad aplicada a un ejército de plasticina. La escena de la casera es más graciosa que cualquier cosa que el estudio haya hecho después.",
        "en": "The 1998 animated film, not the 2020 remake. Small household objects behave like horses, which sounds like a throwaway joke and turns out to be a whole theory of personality applied to a claymation army. The matchmaker scene is funnier than anything the studio has done since."
      }
    },
    {
      "rank": 10,
      "section": 2,
      "votes": 5,
      "voters": ["luaa", "jv", "Costita", "Moranna75", "RobinStark"],
      "year": 2003,
      "director": "Peter Jackson",
      "title": {
        "es": "El Señor de los Anillos: El retorno del Rey",
        "en": "The Lord of the Rings: The Return of the King"
      },
      "blurb": {
        "es": "Tres películas, una tarde larga, y una saga que decidió cerrar con veintiséis protagonistas a la vez en lugar de uno. La película que defiende las tres horas es la única que nadie discute acá: es simplemente la tercera.",
        "en": "Three films, one long afternoon, and a series that decided to end on an army and a delegation of hobbits rather than one hero. The film that makes the case for a three-hour runtime is the one nobody here is arguing about — it is just the third one."
      }
    },
    {
      "rank": 11,
      "section": 2,
      "votes": 5,
      "voters": ["JohannabeSwan", "Sr_Veron", "Cami Romero", "Merrcedes", "Mar —"],
      "year": 1975,
      "director": "Jim Sharman",
      "title": {
        "es": "The Rocky Horror Picture Show",
        "en": "The Rocky Horror Picture Show"
      },
      "blurb": {
        "es": "Gente tirándose contra un muro de gorros rojos a la medianoche, por razones que la película explica una vez y nunca más. Solo funciona si dices los diálogos con el público, así que es menos una película que se mira que una a la que se va. Las canciones son mejores que el argumento, que es el orden correcto.",
        "en": "People throwing themselves at a wall of red hats at midnight, for reasons the film explains once and never again. It only works if you say the lines with the audience, so it is less a film you watch than one you show up for. The songs are better than the plot, which is the correct order."
      }
    },
    {
      "rank": 12,
      "section": 1,
      "votes": 4,
      "voters": ["valencita", "moremidnights", "mau", "milasconfritasss"],
      "year": 1999,
      "director": "Gil Junger",
      "title": {
        "es": "10 Things I Hate About You",
        "en": "10 Things I Hate About You"
      },
      "blurb": {
        "es": "La película de La fierecilla domada con mejor ropa, lo cual es un elogio. Julia Stiles hace del padre de la protagonista y lo saca adelante, y la secuencia donde le devuelve al chico sus propias tácticas vale por toda la película.",
        "en": "A Taming of the Shrew plot with better clothes, which is a compliment. Julia Stiles plays the hero's father and gets it exactly right, and the sequence where she turns the boy's own tactics on him is worth the rest of the film."
      }
    },
    {
      "rank": 13,
      "section": 1,
      "votes": 4,
      "voters": ["johsr", "unamila", "Churrasquinho", "Rick"],
      "year": 1988,
      "director": "Katsuhiro Otomo",
      "title": {
        "es": "Akira",
        "en": "Akira"
      },
      "blurb": {
        "es": "Armada en 1988 con miles de imágenes fijas pintadas a mano y fotografiadas plano a plano. La persecución en las motos no tiene competencia, y el final es de esos raros que deciden frenar en vez de escalar.",
        "en": "Made in 1988 out of thousands of hand-painted stills, photographed one frame at a time. The chase on the bikes has never been matched, and the ending is the rare one that decides to stop rather than escalate."
      }
    },
    {
      "rank": 14,
      "section": 1,
      "votes": 4,
      "voters": ["Colorado", "aimu98", "MonoJob", "Rick"],
      "year": 2004,
      "director": "Michel Gondry",
      "title": {
        "es": "Eternal Sunshine of the Spotless Mind",
        "en": "Eternal Sunshine of the Spotless Mind"
      },
      "blurb": {
        "es": "Una película sobre borrar a alguien y descubrir que el olvido no agarra. Gondry filma mucho como si fuera un recuerdo, tembloroso, y la idea de que la relación no está condenada sino solo es incómoda te lleva más lejos que el giro final.",
        "en": "A film about erasing someone and then discovering the forgetting does not take. Gondry shoots a lot of it like a memory, wobbling, and the trick that the relationship is not doomed just inconvenient gets you further than the twist does."
      }
    },
    {
      "rank": 15,
      "section": 1,
      "votes": 4,
      "voters": ["vicky", "Churrasquinho", "Papita Komi", "Giuly"],
      "year": 2018,
      "director": "Ari Aster",
      "title": {
        "es": "Hereditary",
        "en": "Hereditary"
      },
      "blurb": {
        "es": "Dos horas y media que se mantienen pacientes hasta los últimos veinte minutos, y ahí la paciencia era el miedo desde el principio. Toni Collette sostiene la primera mitad entera con el temor, y la muñeca en la caja no es un monstruo: es un mecanismo.",
        "en": "Two and a half hours that keep being patient until the last twenty minutes, at which point the patience was the horror all along. Toni Collette carries the first half entirely on dread, and the doll in the box is not a monster. It is a mechanism."
      }
    },
    {
      "rank": 16,
      "section": 1,
      "votes": 4,
      "voters": ["KintsuGiA", "tuto", "mau", "Dirk"],
      "year": 2014,
      "director": "Christopher Nolan",
      "title": {
        "es": "Interstellar",
        "en": "Interstellar"
      },
      "blurb": {
        "es": "El diseño sonoro es la razón de ser de la película: los diálogos están mezclados tan bajo que te inclinas para oírlos, y ese esfuerzo es el argumento sobre la distancia que la trama está haciendo. La secuencia de acoplamiento son cuatro minutos de un solo plano y se lo gana, cosa que el final no consigue.",
        "en": "The sound design is the reason for the film's existence: the dialogue is mixed so low you strain for it, and that strain is the argument about distance the plot is making. The docking scene is four minutes of one continuous shot and earns it, which is more than the ending does."
      }
    },
    {
      "rank": 17,
      "section": 1,
      "votes": 4,
      "voters": ["luaa", "Cande Mazzini", "LaTienditaViajera", "Costita"],
      "year": 1972,
      "director": "Francis Ford Coppola",
      "title": {
        "es": "El Padrino",
        "en": "The Godfather"
      },
      "blurb": {
        "es": "La que todo el mundo pondría en esta lista y nadie ordena, porque es una condición y no una preferencia. El Padrino en sí son casi dos horas y media de alguien explicando lo que ya se acordó, y es la película más controlada que se filmó jamás sobre perder el control.",
        "en": "The one everybody would put on this list and nobody ranks, because it is a condition rather than a preference. The godfather itself is barely two and a half hours of somebody explaining what has been agreed, and it is the most controlled film ever made about losing control."
      }
    },
    {
      "rank": 18,
      "section": 1,
      "votes": 4,
      "voters": ["Cande Mazzini", "Colorado", "HappyOreo", "tuto"],
      "year": 2009,
      "director": "Juan José Campanella",
      "title": {
        "es": "El secreto de sus ojos",
        "en": "The Secret in Their Eyes"
      },
      "blurb": {
        "es": "Un asesinato, una pregunta sin respuesta durante veinticinco años y una jubilación que no fue una jubilación. Campanella hace que el policial cargue con el trabajo emocional y reserva la respuesta para la última escena, donde la cámara la mira antes de que nadie la diga.",
        "en": "A murder, a twenty-five-year unanswered question, and a retirement that was not a retirement. Campanella makes the procedural do the emotional work and holds back the answer until the last scene, where the camera looks at it before anybody says it out loud."
      }
    },
    {
      "rank": 19,
      "section": 1,
      "votes": 4,
      "voters": ["MonoJob", "Costita", "Dirk", "Cacho"],
      "year": 1994,
      "director": "Frank Darabont",
      "title": {
        "es": "Cadena perpetua",
        "en": "The Shawshank Redemption"
      },
      "blurb": {
        "es": "La película que la gente describe cuando no va a describir nada más. También tiene el mejor final de todo lo que hay acá, porque la cámara se queda en Tim Robbins cuando lo sueltan y corta antes de que llegue al auto, así que la esperanza sigue siendo suya.",
        "en": "The film people describe when they are not going to describe anything else. It also has the best ending of anything here, because the camera holds on Tim Robbins being let go and cuts before he reaches the car, so the hope stays his."
      }
    },
    {
      "rank": 20,
      "section": 1,
      "votes": 4,
      "voters": ["Vicx", "MonoJob", "Merrcedes", "Rick"],
      "year": 1998,
      "director": "Peter Weir",
      "title": {
        "es": "El show de Truman",
        "en": "The Truman Show"
      },
      "blurb": {
        "es": "Todos los que están filmados por otro, resueltos con una luz en el cielo. Weir mantiene el pánico de Truman tan chico que la película nunca se siente como un thriller sobre una jaula: se siente como una comedia sobre un hombre que descubre que tiene un trabajo. Jim Carrey juega los últimos diez minutos como un hombre sosteniendo una puerta cerrada.",
        "en": "Everybody who is filmed by somebody else, solved with a light in the sky. Weir keeps Truman's panic so small that the film never feels like a thriller about a cage — it feels like a comedy about a man finding out he has a job. Jim Carrey plays the last ten minutes as a man holding a door shut."
      }
    }
  ];

}());
