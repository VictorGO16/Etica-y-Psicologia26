export const TESTS = {
  "discernimiento": {
    "id": "discernimiento",
    "version": 10,
    "no": "01",
    "title": "Discernimiento ético",
    "short": "Método de discernimiento",
    "desc": "Preguntas sobre los cinco pasos del método y las distinciones que permiten aplicarlo con criterio.",
    "questions": [
      {
        "id": "disc-hecho-objetivo",
        "version": 1,
        "tag": "Paso 1 (Hecho)",
        "q": "¿Cuál es el objetivo principal del paso 1 (Hecho) en el método de discernimiento ético?",
        "options": [
          {
            "id": "formulate_guiding_question",
            "text": "Delimitar el dilema central y formular una pregunta directriz que oriente el análisis posterior."
          },
          {
            "id": "reconstruct_context",
            "text": "Reconstruir el contexto, los actores y las incertidumbres para obtener una visión completa del caso."
          },
          {
            "id": "identify_values",
            "text": "Identificar los valores y principios comprometidos y explicar las tensiones que aparecen entre ellos."
          },
          {
            "id": "synthesize_criteria",
            "text": "Sintetizar los criterios, prioridades y condiciones que servirán para orientar la decisión final."
          }
        ],
        "correctId": "formulate_guiding_question",
        "hint": "Cada paso responde una pregunta distinta. En el paso 1 (Hecho) interesa delimitar cuál es el dilema que guiará el resto del análisis.",
        "why": "El paso 1 (Hecho) identifica y formula el dilema ético central. Su resultado es una pregunta directriz clara que permite orientar los pasos siguientes y que puede revisarse si el análisis obliga a precisar el problema.",
        "source": {
          "label": "Sesión 2 · Paso 1 (Hecho) · resultado del paso",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/hecho-resultado-del-paso"
        },
        "sourceTerms": [
          "dilema ético central",
          "pregunta directriz",
          "orientar el resto del análisis",
          "proceso iterativo"
        ]
      },
      {
        "id": "disc-hecho-pregunta-directriz",
        "version": 2,
        "tag": "Paso 1 (Hecho)",
        "q": "Al formular la pregunta directriz del paso 1 (Hecho), ¿qué característica se ajusta mejor a lo planteado en la sesión?",
        "options": [
          {
            "id": "neutral_open",
            "text": "Orientarla al cómo proceder, de forma neutral y sin incorporar juicios de valor ni supuestos implícitos."
          },
          {
            "id": "likely_solution",
            "text": "Orientarla al cómo proceder, incorporando desde el inicio la solución que parece más razonable para el caso."
          },
          {
            "id": "all_dilemmas",
            "text": "Formularla de manera amplia para reunir en una sola pregunta todos los dilemas éticos potenciales del caso."
          },
          {
            "id": "fixed_wording",
            "text": "Definirla al comienzo y mantenerla sin cambios para que todo el análisis posterior responda al mismo planteamiento."
          }
        ],
        "correctId": "neutral_open",
        "hint": "La formulación del dilema debe orientar el análisis sin anticipar una conclusión.",
        "why": "La sesión indica que el dilema se plantea como una pregunta orientada al “cómo proceder”, de forma neutral y evitando juicios de valor o supuestos implícitos. La formulación puede revisarse si el análisis posterior obliga a precisar el problema.",
        "source": {
          "label": "Sesión 2 · Paso 1 (Hecho) · delimitar el problema",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/hecho-delimitar-el-problema"
        },
        "sourceTerms": [
          "cómo proceder",
          "forma neutral",
          "juicios de valor",
          "supuestos implícitos"
        ]
      },
      {
        "id": "disc-hecho-dilema-principal",
        "version": 1,
        "tag": "Paso 1 (Hecho)",
        "q": "Si un caso presenta varios dilemas éticos posibles, ¿qué corresponde hacer en el paso 1 (Hecho)?",
        "options": [
          {
            "id": "select_central",
            "text": "Seleccionar el dilema más central, que requiera una resolución práctica, y trabajar desde esa base."
          },
          {
            "id": "merge_all",
            "text": "Integrar todos los dilemas en una sola pregunta para que ninguno pierda peso durante el análisis."
          },
          {
            "id": "legal_priority",
            "text": "Priorizar el dilema que tenga una regulación más explícita y dejar los demás para una revisión posterior."
          },
          {
            "id": "defer_selection",
            "text": "Mantener todos los dilemas abiertos y decidir cuál es central recién al llegar al paso 3 (Implicancias éticas)."
          }
        ],
        "correctId": "select_central",
        "hint": "El método necesita un punto de partida suficientemente delimitado, aunque ese punto pueda revisarse después.",
        "why": "Cuando aparecen varios dilemas, el paso 1 (Hecho) exige seleccionar el más central y el que requiere una resolución práctica. Esa elección da dirección al análisis y puede reformularse si los pasos posteriores muestran que el problema estaba mal delimitado.",
        "source": {
          "label": "Sesión 2 · Paso 1 (Hecho) · delimitar el problema",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/hecho-delimitar-el-problema"
        },
        "sourceTerms": [
          "dilemas éticos potenciales",
          "dilema principal",
          "resolución práctica",
          "revisarse y refinarse"
        ]
      },
      {
        "id": "disc-comprension-objetivo",
        "version": 1,
        "tag": "Paso 2 (Comprensión del hecho)",
        "q": "¿Cuál es el propósito principal del paso 2 (Comprensión del hecho)?",
        "options": [
          {
            "id": "complete_objective_view",
            "text": "Obtener una visión completa y objetiva del dilema antes de emitir juicios de valor sobre la situación."
          },
          {
            "id": "preliminary_priority",
            "text": "Definir qué valores deberían tener prioridad para que la recopilación de información se concentre en ellos."
          },
          {
            "id": "ethical_tensions",
            "text": "Identificar los valores y principios comprometidos y establecer cómo entran en tensión dentro del dilema."
          },
          {
            "id": "possible_actions",
            "text": "Comparar cursos de acción posibles y descartar aquellos que resulten poco viables en las condiciones del caso."
          }
        ],
        "correctId": "complete_objective_view",
        "hint": "El paso 2 (Comprensión del hecho) todavía no pondera valores ni recomienda acciones. Busca comprender qué está ocurriendo y qué información falta.",
        "why": "El paso 2 (Comprensión del hecho) busca una visión completa y objetiva del dilema. Incluye contexto, actores, intereses, recursos, limitaciones e incertidumbres, sin emitir juicios de valor aún.",
        "source": {
          "label": "Sesión 2 · Paso 2 (Comprensión del hecho) · comprender antes de evaluar",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/comprender-antes-de-evaluar"
        },
        "sourceTerms": [
          "visión completa y objetiva",
          "sin emitir juicios de valor aún",
          "información",
          "limitaciones prácticas"
        ]
      },
      {
        "id": "disc-comprension-contenidos",
        "version": 1,
        "tag": "Paso 2 (Comprensión del hecho)",
        "q": "¿Cuál de estos contenidos no corresponde al paso 2 (Comprensión del hecho)?",
        "options": [
          {
            "id": "context",
            "text": "El contexto social, legal, económico y cultural en el que se desarrolla la situación analizada."
          },
          {
            "id": "actors",
            "text": "Los actores involucrados, junto con sus roles, intereses y formas de participación en el caso."
          },
          {
            "id": "uncertainty",
            "text": "Las limitaciones, los recursos disponibles y las áreas donde la información todavía es incompleta."
          },
          {
            "id": "action_recommendation",
            "text": "La recomendación concreta que se propone como respuesta final al dilema una vez terminado el análisis."
          }
        ],
        "correctId": "action_recommendation",
        "hint": "Distingue entre información necesaria para comprender el caso y lo que corresponde elaborar al final del proceso.",
        "why": "La recomendación concreta se elabora en el paso 5 (Sugerencia de acción concreta). En el paso 2 (Comprensión del hecho) se recopilan antecedentes sobre el contexto, los actores, los recursos, las limitaciones y las incertidumbres relevantes.",
        "source": {
          "label": "Sesión 2 · Paso 2 (Comprensión del hecho)",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/comprensi%C3%B3n-del-hecho"
        },
        "sourceTerms": [
          "contexto",
          "actores involucrados",
          "limitaciones y recursos",
          "incertidumbres"
        ]
      },
      {
        "id": "disc-comprension-informacion-incompleta",
        "version": 2,
        "tag": "Paso 2 (Comprensión del hecho)",
        "q": "En el paso 2 (Comprensión del hecho), ¿cómo propone el método trabajar cuando una decisión debe tomarse con información incompleta?",
        "options": [
          {
            "id": "recognize_limit",
            "text": "Continuar el análisis distinguiendo lo que se sabe de lo que sigue incierto y reconocer esa limitación."
          },
          {
            "id": "wait_complete",
            "text": "Suspender el análisis hasta reunir toda la información relevante, aunque la decisión tenga que postergarse."
          },
          {
            "id": "assume_likely",
            "text": "Completar los vacíos con el escenario más probable para poder trabajar con una descripción cerrada del caso."
          },
          {
            "id": "ignore_uncertain",
            "text": "Excluir del análisis los antecedentes inciertos y considerar solamente los hechos que hayan sido confirmados."
          }
        ],
        "correctId": "recognize_limit",
        "hint": "La clase reconoce que la información disponible puede ser incompleta y que aun así puede ser necesario decidir.",
        "why": "La recopilación de información debe ser lo más exhaustiva posible dentro de las limitaciones prácticas. La sesión reconoce que puede ser necesario tomar decisiones con información incompleta, por lo que esa limitación debe quedar explícitamente reconocida en el análisis.",
        "source": {
          "label": "Sesión 2 · Paso 2 (Comprensión del hecho) · comprender antes de evaluar",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/comprender-antes-de-evaluar"
        },
        "sourceTerms": [
          "información incompleta",
          "limitaciones prácticas",
          "recopilación de información",
          "tomar decisiones"
        ]
      },
      {
        "id": "disc-implicancias-valores-principios",
        "version": 1,
        "tag": "Paso 3 (Implicancias éticas)",
        "q": "En el paso 3 (Implicancias éticas), ¿qué diferencia hay entre un valor y un principio?",
        "options": [
          {
            "id": "intrinsic_and_guideline",
            "text": "Un valor tiene importancia intrínseca y un principio orienta cómo aproximarse a ese valor en situaciones concretas."
          },
          {
            "id": "goal_and_reason",
            "text": "Un valor describe el resultado que se espera alcanzar y un principio explica por qué ese resultado sería deseable."
          },
          {
            "id": "shared_and_binding",
            "text": "Un valor expresa una aspiración compartida y un principio corresponde a una regla obligatoria de carácter legal."
          },
          {
            "id": "same_level",
            "text": "Ambos cumplen la misma función dentro del análisis y sólo se distinguen por el nivel de generalidad con que se formulan."
          }
        ],
        "correctId": "intrinsic_and_guideline",
        "hint": "En la sesión, los dos conceptos se presentan como relacionados, pero cumplen funciones distintas dentro de la reflexión ética.",
        "why": "Los valores son elementos con importancia intrínseca en la reflexión ética. Los principios son directrices o normas que orientan cómo nos aproximamos a esos valores o cómo los aplicamos en situaciones concretas.",
        "source": {
          "label": "Sesión 2 · Paso 3 (Implicancias éticas) · valores y principios",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/valores-y-principios"
        },
        "sourceTerms": [
          "importancia intrínseca",
          "directrices o normas",
          "aplicamos un valor",
          "situaciones concretas"
        ]
      },
      {
        "id": "disc-implicancias-amplitud",
        "version": 1,
        "tag": "Paso 3 (Implicancias éticas)",
        "q": "¿Qué exige el criterio de amplitud en el paso 3 (Implicancias éticas)?",
        "options": [
          {
            "id": "multiple_perspectives",
            "text": "Considerar múltiples perspectivas éticas, sin limitar el análisis a un único enfoque moral."
          },
          {
            "id": "many_values",
            "text": "Enumerar la mayor cantidad posible de valores y principios, aunque varios tengan poca relación con el dilema."
          },
          {
            "id": "one_framework_many_rules",
            "text": "Aplicar distintos principios de una misma corriente para mantener un único enfoque moral durante el análisis."
          },
          {
            "id": "all_contexts",
            "text": "Ampliar la descripción del caso incorporando nuevos antecedentes antes de identificar los valores comprometidos."
          }
        ],
        "correctId": "multiple_perspectives",
        "hint": "La amplitud se refiere a considerar más de una perspectiva ética, no a acumular información o valores sin relación clara con el dilema.",
        "why": "La amplitud consiste en considerar múltiples perspectivas éticas sin limitar el análisis a un único enfoque moral. Después, el criterio de pertinencia permite distinguir cuáles aportan más al dilema concreto.",
        "source": {
          "label": "Sesión 2 · Paso 3 (Implicancias éticas) · amplitud",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/una-mirada-amplia-pero-pertinente"
        },
        "sourceTerms": [
          "amplitud",
          "múltiples perspectivas éticas",
          "sin limitar el análisis a un único enfoque moral"
        ]
      },
      {
        "id": "disc-implicancias-pertinencia",
        "version": 1,
        "tag": "Paso 3 (Implicancias éticas)",
        "q": "¿Qué exige el criterio de pertinencia en el paso 3 (Implicancias éticas)?",
        "options": [
          {
            "id": "prioritize_relevant",
            "text": "Priorizar los valores y principios más relevantes para el dilema específico, evitando consideraciones tangenciales."
          },
          {
            "id": "widely_shared",
            "text": "Dar mayor peso a los valores compartidos por más actores, aunque su relación con el dilema sea secundaria."
          },
          {
            "id": "strongest_rule",
            "text": "Priorizar los principios con respaldo normativo más explícito, aunque no sean los más relevantes para el dilema."
          },
          {
            "id": "retain_everything",
            "text": "Mantener todas las consideraciones con el mismo peso hasta llegar al paso 5 (Sugerencia de acción concreta)."
          }
        ],
        "correctId": "prioritize_relevant",
        "hint": "La pertinencia exige distinguir qué valores y principios están realmente conectados con el dilema específico.",
        "why": "La pertinencia consiste en priorizar los valores y principios más relevantes para el dilema específico y evitar perderse en consideraciones tangenciales. La amplitud abre el análisis; la pertinencia ayuda a concentrarlo.",
        "source": {
          "label": "Sesión 2 · Paso 3 (Implicancias éticas) · pertinencia",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/una-mirada-amplia-pero-pertinente"
        },
        "sourceTerms": [
          "pertinencia",
          "relevante para el dilema",
          "evitando perderse en consideraciones tangenciales"
        ]
      },
      {
        "id": "disc-elementos-funcion",
        "version": 1,
        "tag": "Paso 4 (Elementos para el discernimiento)",
        "q": "¿Qué función cumple principalmente el paso 4 (Elementos para el discernimiento)?",
        "options": [
          {
            "id": "bridge_to_action",
            "text": "Sintetizar lo trabajado en los pasos anteriores para identificar aquello que realmente orientará la acción."
          },
          {
            "id": "complete_facts",
            "text": "Completar los antecedentes que faltaron en la comprensión del hecho antes de revisar sus implicancias éticas."
          },
          {
            "id": "select_framework",
            "text": "Elegir la corriente ética que tendrá prioridad para que la decisión final se apoye en un único enfoque."
          },
          {
            "id": "implementation_plan",
            "text": "Convertir una acción ya escogida en un plan de implementación con responsables, plazos y recursos definidos."
          }
        ],
        "correctId": "bridge_to_action",
        "hint": "En la sesión, este paso aparece como un puente entre el análisis ético y las sugerencias de acción concretas.",
        "why": "El paso 4 (Elementos para el discernimiento) sintetiza hechos, valores, principios, consecuencias y consideraciones prácticas para identificar aquello que realmente orientará la acción. Funciona como un puente entre el análisis ético y la sugerencia concreta.",
        "source": {
          "label": "Sesión 2 · Paso 4 (Elementos para el discernimiento)",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/del-an%C3%A1lisis-a-los-criterios-de-decisi%C3%B3n"
        },
        "sourceTerms": [
          "puente",
          "criterios de decisión",
          "prioridades y ponderaciones",
          "consideraciones prácticas"
        ]
      },
      {
        "id": "disc-elementos-inflexion",
        "version": 1,
        "tag": "Paso 4 (Elementos para el discernimiento)",
        "q": "En el paso 4 (Elementos para el discernimiento), ¿cuál de estas descripciones corresponde mejor a un punto de inflexión?",
        "options": [
          {
            "id": "changes_recommendation",
            "text": "Una condición crítica que, si cambia, podría justificar un curso de acción distinto al que hoy parece adecuado."
          },
          {
            "id": "expected_effect",
            "text": "Una consecuencia probable de la decisión que se espera encontrar de manera similar en cualquiera de las alternativas."
          },
          {
            "id": "priority_criterion",
            "text": "Un criterio que ya fue considerado prioritario y que conserva el mismo peso aunque cambien otros antecedentes del caso."
          },
          {
            "id": "implementation_resource",
            "text": "Un recurso necesario para ejecutar la alternativa escogida una vez que la recomendación ya ha sido formulada."
          }
        ],
        "correctId": "changes_recommendation",
        "hint": "Un punto de inflexión no es simplemente un dato importante. Es algo capaz de modificar significativamente la recomendación.",
        "why": "Los puntos de inflexión son factores críticos que podrían cambiar significativamente el curso de acción recomendado. Sirven para reconocer de qué condiciones depende una decisión y cuándo sería necesario revisarla.",
        "source": {
          "label": "Sesión 2 · Paso 4 (Elementos para el discernimiento) · puntos de inflexión",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/elementos-para-el-discernimiento"
        },
        "sourceTerms": [
          "puntos de inflexión",
          "factores críticos",
          "cambiar significativamente",
          "curso de acción recomendado"
        ]
      },
      {
        "id": "disc-accion-coherencia",
        "version": 1,
        "tag": "Paso 5 (Sugerencia de acción concreta)",
        "q": "¿Qué debe cumplir una sugerencia elaborada en el paso 5 (Sugerencia de acción concreta) para ser coherente con el método?",
        "options": [
          {
            "id": "answer_and_reflect",
            "text": "Responder la pregunta directriz y reflejar los valores, principios y elementos para el discernimiento identificados antes."
          },
          {
            "id": "most_feasible",
            "text": "Escoger la alternativa más fácil de implementar y construir después una justificación compatible con el análisis previo."
          },
          {
            "id": "general_principle",
            "text": "Expresar el principio que debería orientar el caso, aunque todavía no se especifique qué acción concreta realizar."
          },
          {
            "id": "team_consensus",
            "text": "Recoger la alternativa que genere mayor acuerdo en el equipo y usar ese consenso como fundamento principal de la sugerencia."
          }
        ],
        "correctId": "answer_and_reflect",
        "hint": "El paso 5 (Sugerencia de acción concreta) no introduce una opinión nueva. La recomendación debe poder reconocerse como resultado de todo el recorrido anterior.",
        "why": "La sugerencia de acción concreta debe responder la pregunta directriz, reflejar el análisis previo y ofrecer una guía clara y práctica. También debe considerar el contexto, las limitaciones, la implementación y las consecuencias previsibles.",
        "source": {
          "label": "Sesión 2 · Paso 5 (Sugerencia de acción concreta)",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/traducir-el-an%C3%A1lisis-en-acci%C3%B3n"
        },
        "sourceTerms": [
          "responder la pregunta directriz",
          "reflejar el análisis previo",
          "realista y adaptable",
          "implementación"
        ]
      },
      {
        "id": "disc-accion-condicional",
        "version": 1,
        "tag": "Paso 5 (Sugerencia de acción concreta)",
        "q": "¿Qué caracteriza a una recomendación condicional en el paso 5 (Sugerencia de acción concreta)?",
        "options": [
          {
            "id": "different_actions_by_conditions",
            "text": "Propone cursos de acción distintos según las condiciones, los riesgos o la información que finalmente se presenten."
          },
          {
            "id": "delay_until_known",
            "text": "Pospone la recomendación hasta que desaparezcan las incertidumbres y sea posible escoger una sola acción definitiva."
          },
          {
            "id": "one_action_with_adjustments",
            "text": "Mantiene una misma acción y agrega ajustes de implementación para enfrentar dificultades que aparezcan durante su ejecución."
          },
          {
            "id": "several_parallel_actions",
            "text": "Propone varias acciones al mismo tiempo para distintos actores aunque las condiciones del caso permanezcan sin cambios."
          }
        ],
        "correctId": "different_actions_by_conditions",
        "hint": "La condición modifica qué curso de acción resulta apropiado, no sólo la manera de implementar una decisión ya tomada.",
        "why": "Una recomendación condicional reconoce que el curso de acción puede cambiar si cambian condiciones relevantes, riesgos o información disponible. Sigue siendo el resultado del análisis realizado en los pasos anteriores.",
        "source": {
          "label": "Sesión 2 · Paso 5 (Sugerencia de acción concreta) · recomendación condicional",
          "href": "../sesiones/S2%20-%20M%C3%A9todo.html#/una-recomendaci%C3%B3n-puede-ser-condicional"
        },
        "sourceTerms": [
          "si se da A",
          "si se da B",
          "cambian las condiciones",
          "información disponible"
        ]
      }
    ]
  },
  "virtud": {
    "id": "virtud",
    "version": 7,
    "no": "02",
    "title": "Ética de la virtud",
    "short": "Carácter y florecimiento",
    "desc": "Carácter, hábito, virtud, desarrollo humano y sabiduría moral.",
    "questions": [
      {
        "id": "virtud-caracter-habito",
        "version": 1,
        "tag": "Acto, hábito y carácter",
        "q": "Según el material, ¿qué relación explica mejor cómo se forma el carácter?",
        "options": [
          {
            "id": "act_habit_disposition",
            "text": "La repetición de actos consolida hábitos y, cuando estos se arraigan, configuran disposiciones que forman el carácter."
          },
          {
            "id": "character_first",
            "text": "El carácter aparece primero y luego determina los hábitos y actos que una persona repite en distintas situaciones."
          },
          {
            "id": "isolated_act",
            "text": "Un acto especialmente bueno puede formar por sí solo una disposición estable cuando expresa una intención adecuada."
          },
          {
            "id": "external_rules",
            "text": "Las reglas sociales forman el carácter cuando una persona logra cumplirlas de manera estable y sin excepciones."
          }
        ],
        "correctId": "act_habit_disposition",
        "hint": "El material presenta una secuencia entre actos concretos, repetición, hábito y disposiciones arraigadas.",
        "why": "El material presenta el carácter como algo adquirido, no innato. Los actos repetidos consolidan hábitos y esos hábitos pueden arraigarse como disposiciones que configuran una segunda naturaleza.",
        "sourceQuote": "Un acto justo aislado no hace que una persona sea justa, sino la reiteración constante de dichos actos.",
        "source": {
          "label": "PPT Sesión 3 · lámina 5 · Francisco De Ferari",
          "href": "../recursos/otras-clases/PPT%20Sesi%C3%B3n%203_%20Introducci%C3%B3n%20a%20la%20%C3%A9tica%20y%20la%20moral.pptx",
          "download": true
        },
        "sourceTerms": [
          "acto",
          "hábito",
          "disposición",
          "carácter"
        ]
      },
      {
        "id": "virtud-excelencia-habito",
        "version": 1,
        "tag": "Virtud y vicio",
        "q": "¿Cuál descripción corresponde mejor a la noción de virtud presentada en el material?",
        "options": [
          {
            "id": "rooted_good_habit",
            "text": "Un hábito bueno y arraigado que facilita mejores acciones y favorece el desarrollo pleno de las capacidades humanas."
          },
          {
            "id": "isolated_success",
            "text": "Una acción excepcionalmente buena que demuestra excelencia, aunque no exista una disposición estable en quien la realiza."
          },
          {
            "id": "rule_obedience",
            "text": "El cumplimiento estable de reglas externas que permite evitar errores y conservar una conducta socialmente aceptada."
          },
          {
            "id": "useful_skill",
            "text": "Una habilidad eficaz para alcanzar objetivos que adquiere valor moral cuando produce resultados favorables."
          }
        ],
        "correctId": "rooted_good_habit",
        "hint": "La virtud se presenta como una disposición arraigada vinculada con excelencia y desarrollo humano.",
        "why": "El material vincula la virtud con hábitos buenos enraizados, excelencia y desarrollo pleno del ser humano. No la presenta como un acto aislado, obediencia externa o mera eficacia.",
        "sourceQuote": "Hábitos buenos enraizados que potencian y facilitan las mejores acciones humanas.",
        "source": {
          "label": "PPT Sesión 3 · lámina 6 · Francisco De Ferari",
          "href": "../recursos/otras-clases/PPT%20Sesi%C3%B3n%203_%20Introducci%C3%B3n%20a%20la%20%C3%A9tica%20y%20la%20moral.pptx",
          "download": true
        },
        "sourceTerms": [
          "virtud",
          "excelencia",
          "hábitos buenos enraizados",
          "desarrollo pleno"
        ]
      },
      {
        "id": "virtud-potencia-acto-ergon",
        "version": 2,
        "tag": "Potencia, acto y ergon",
        "case": "Una estudiante tiene aptitudes para la escucha clínica. Con práctica, supervisión y estudio logra convertir esas posibilidades en una capacidad profesional cada vez más desarrollada.",
        "q": "Según la visión teleológica presentada en el material, ¿cómo se describe mejor este proceso?",
        "options": [
          {
            "id": "potency_act_ergon",
            "text": "La aptitud corresponde a una potencia, su desarrollo es un paso al acto y su realización plena apunta al ergon o función propia."
          },
          {
            "id": "ergon_before_act",
            "text": "La aptitud ya constituye el ergon plenamente logrado y la práctica posterior sólo permite conservar ese resultado en el tiempo."
          },
          {
            "id": "reverse_potency_act",
            "text": "La potencia corresponde a una capacidad ya realizada, mientras que el acto designa las posibilidades que todavía esperan desarrollarse."
          },
          {
            "id": "habit_equals_ergon",
            "text": "La repetición de una conducta basta para alcanzar el ergon, sin que sea necesario distinguir entre potencia y acto."
          }
        ],
        "correctId": "potency_act_ergon",
        "hint": "En el material, la potencia nombra capacidades y posibilidades; el acto, su actualización; y el ergon, el fin o función plenamente lograda.",
        "why": "La aptitud inicial puede entenderse como potencia. Su desarrollo mediante práctica, supervisión y estudio corresponde a la actualización en acto. El ergon nombra el fin o función específica plenamente lograda.",
        "sourceQuote": "Todos los entes tienen una tendencia intrínseca a realizar su fin propio.",
        "source": {
          "label": "PPT Sesión 3 · lámina 19 · Francisco De Ferari",
          "href": "../recursos/otras-clases/PPT%20Sesi%C3%B3n%203_%20Introducci%C3%B3n%20a%20la%20%C3%A9tica%20y%20la%20moral.pptx",
          "download": true
        },
        "sourceTerms": [
          "potencia",
          "acto",
          "ergon",
          "fin propio"
        ]
      },
      {
        "id": "virtud-sabiduria-moral",
        "version": 2,
        "tag": "Sabiduría moral",
        "case": "Una persona debe elegir entre dos cursos posibles. Ambos son legítimos y ninguno produce un daño evidente, pero no son equivalentes para la vida que está construyendo.",
        "q": "¿Qué idea de la sabiduría moral presentada en el material orienta mejor esta elección?",
        "options": [
          {
            "id": "prefer_preferable",
            "text": "Aprender a diferenciar y optar por lo más bueno para cada cual, reconociendo que algunas elecciones son cualitativamente superiores a otras."
          },
          {
            "id": "effort_as_value",
            "text": "Elegir la alternativa que exija mayor esfuerzo personal, porque la dificultad de una elección es una señal suficiente de su valor moral."
          },
          {
            "id": "habit_as_criterion",
            "text": "Preferir la alternativa que ya se haya convertido en hábito, porque una conducta estable ofrece por sí misma un criterio de vida buena."
          },
          {
            "id": "custom_as_criterion",
            "text": "Seguir la alternativa más habitual en el entorno, porque una práctica social consolidada permite evitar preferencias puramente individuales."
          }
        ],
        "correctId": "prefer_preferable",
        "hint": "El material sostiene que no todo da lo mismo y que la sabiduría moral exige aprender a diferenciar y optar.",
        "why": "La sabiduría moral consiste en aprender a diferenciar y optar por lo más bueno para cada cual. El material agrega que no todo da lo mismo y que hay elecciones cualitativamente superiores a otras en términos de desarrollo humano.",
        "sourceQuote": "La sabiduría moral consiste en aprender a diferenciar y optar por lo más bueno para cada cual: preferir lo preferible.",
        "source": {
          "label": "PPT Sesión 3 · lámina 11 · Francisco De Ferari",
          "href": "../recursos/otras-clases/PPT%20Sesi%C3%B3n%203_%20Introducci%C3%B3n%20a%20la%20%C3%A9tica%20y%20la%20moral.pptx",
          "download": true
        },
        "sourceTerms": [
          "sabiduría moral",
          "no todo da lo mismo",
          "preferir lo preferible",
          "desarrollo humano"
        ]
      }
    ]
  },
  "deontologia": {
    "id": "deontologia",
    "version": 8,
    "no": "03",
    "title": "Deontología",
    "short": "Kant y el deber",
    "desc": "Deber, máxima, universalización y trato de las personas como fines.",
    "questions": [
      {
        "id": "deon-criterio-central",
        "version": 2,
        "tag": "Criterio deontológico",
        "q": "¿Cuál afirmación representa mejor el lugar del deber en la deontología kantiana presentada en la clase?",
        "options": [
          {
            "id": "duty_moral_value",
            "text": "Una acción puede coincidir con lo correcto y aun no tener pleno valor moral si se realiza sólo por miedo, prestigio o interés."
          },
          {
            "id": "external_conformity",
            "text": "Una acción tiene pleno valor moral cuando coincide externamente con lo correcto, cualquiera sea el motivo por el que se realiza."
          },
          {
            "id": "external_order",
            "text": "Una acción tiene pleno valor moral cuando cumple una orden válida de una autoridad, porque la obligación moral proviene de esa regla externa."
          },
          {
            "id": "interest_supports_duty",
            "text": "Una acción tiene pleno valor moral cuando el deber coincide con los intereses del agente y le ofrece una razón conveniente para actuar."
          }
        ],
        "correctId": "duty_moral_value",
        "hint": "La clase distingue entre coincidir con lo correcto y actuar por respeto a la ley moral.",
        "why": "La clase señala que una acción puede coincidir con lo correcto y aun así no tener pleno valor moral si fue hecha sólo por miedo, prestigio o interés. El deber se presenta como la necesidad de una acción por respeto a la ley moral, no como obediencia a una orden externa.",
        "source": {
          "label": "Sesión 4 · El deber en Kant",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/deber-kant"
        },
        "sourceTerms": [
          "deber",
          "respeto a la ley",
          "ley moral",
          "miedo, prestigio o interés"
        ]
      },
      {
        "id": "deon-conforme-por-deber",
        "version": 1,
        "tag": "Conforme al deber y por deber",
        "case": "Dos profesionales cumplen la misma obligación. Una persona lo hace para evitar una sanción. La otra lo hace porque reconoce que esa obligación debe guiar su conducta aun cuando le resulte inconveniente.",
        "q": "¿Qué diferencia es relevante desde la distinción kantiana presentada en la clase?",
        "options": [
          {
            "id": "motive_duty",
            "text": "Quien reconoce la obligación actúa por deber; quien busca evitar la sanción sólo actúa conforme al deber."
          },
          {
            "id": "same_moral_value",
            "text": "Ambas acciones tienen el mismo valor moral, porque lo único relevante es que la conducta visible coincida con lo debido."
          },
          {
            "id": "consequence_difference",
            "text": "La diferencia depende de cuál de las dos conductas produzca mejores consecuencias para las personas involucradas."
          },
          {
            "id": "emotion_difference",
            "text": "La diferencia depende de cuál de las dos personas experimente mayor empatía o compromiso afectivo al cumplir la obligación."
          }
        ],
        "correctId": "motive_duty",
        "hint": "La clase distingue entre una conducta que coincide externamente con lo debido y una acción realizada porque el agente reconoce una obligación.",
        "why": "Actuar para evitar una sanción puede producir una conducta conforme al deber. Actuar por deber significa que la obligación funciona como razón para actuar, incluso cuando resulte incómoda o poco conveniente.",
        "source": {
          "label": "Sesión 4 · Actuar conforme al deber y actuar por deber",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/actuar-conforme-al-deber-y-actuar-por-deber"
        },
        "sourceTerms": [
          "conforme al deber",
          "por deber",
          "obligación",
          "razón moral"
        ]
      },
      {
        "id": "deon-imperativo",
        "version": 2,
        "tag": "Imperativos",
        "q": "¿Cuál de estos mandatos tiene la forma de un imperativo categórico según la clase?",
        "options": [
          {
            "id": "trust_as_end",
            "text": "Respeta la confidencialidad porque así conservarás la confianza de las personas que atiendes."
          },
          {
            "id": "evaluation_as_end",
            "text": "Cumple cuidadosamente las normas del servicio porque de ese modo obtendrás una mejor evaluación profesional."
          },
          {
            "id": "unconditional_duty",
            "text": "Actúa de acuerdo con una exigencia moral aunque no sirva como medio para alcanzar un fin particular que deseas."
          },
          {
            "id": "reputation_as_end",
            "text": "No ocultes información porque hacerlo podría perjudicar tu reputación profesional y dificultar tus objetivos futuros."
          }
        ],
        "correctId": "unconditional_duty",
        "hint": "La diferencia está en si el mandato depende o no de un fin particular que el agente quiere alcanzar.",
        "why": "El imperativo hipotético ordena una acción como medio para alcanzar un fin. El imperativo categórico ordena sin depender de fines particulares. Por eso conservar confianza, obtener una buena evaluación o proteger la reputación siguen siendo fines condicionantes del mandato.",
        "source": {
          "label": "Sesión 4 · Del deber al imperativo categórico",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/imperativos"
        },
        "sourceTerms": [
          "imperativo hipotético",
          "imperativo categórico",
          "fines particulares"
        ]
      },
      {
        "id": "deon-universalizacion",
        "version": 1,
        "tag": "Universalización",
        "case": "Una persona necesita dinero y promete devolverlo, aunque sabe que no lo hará.",
        "q": "¿Qué objeción expresa mejor la prueba de universalización presentada en la clase?",
        "options": [
          {
            "id": "common_rule",
            "text": "Si esa máxima se volviera una regla común, la práctica de prometer perdería credibilidad y la propia estrategia dejaría de funcionar."
          },
          {
            "id": "aggregate_benefit",
            "text": "La promesa podría aceptarse si el beneficio que obtiene la persona supera los costos que recaen sobre quienes resulten afectados."
          },
          {
            "id": "relationship_exception",
            "text": "La promesa podría justificarse si protege una relación importante y evita un daño mayor en las circunstancias particulares del caso."
          },
          {
            "id": "cost_distribution",
            "text": "La promesa debería rechazarse si sus costos terminan concentrándose en personas distintas de quienes reciben sus beneficios."
          }
        ],
        "correctId": "common_rule",
        "hint": "La universalización pregunta si la máxima que autoriza la acción puede sostenerse como regla común sin destruir la práctica que la hace posible.",
        "why": "Si prometer sin intención de cumplir se convirtiera en una regla común, la práctica de prometer perdería credibilidad. La máxima usa una práctica que ella misma debilita cuando se generaliza.",
        "source": {
          "label": "Sesión 4 · Universalización",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/universalizacion"
        },
        "sourceTerms": [
          "máxima",
          "ley universal",
          "regla común"
        ]
      },
      {
        "id": "deon-humanidad-consentimiento",
        "version": 1,
        "tag": "Humanidad como fin",
        "case": "Una institución propone una intervención y espera que un grupo acepte participar. La información entregada destaca beneficios, pero omite riesgos o condiciones que probablemente cambiarían la decisión de algunas personas.",
        "q": "¿Cuál crítica corresponde mejor a la formulación kantiana de humanidad como fin?",
        "options": [
          {
            "id": "instrumentalization",
            "text": "La omisión impide que las personas evalúen suficientemente su participación y puede reducirlas a medios de un plan ajeno."
          },
          {
            "id": "total_welfare",
            "text": "La omisión es problemática si disminuye el bienestar total esperado al producir consecuencias negativas para quienes participan."
          },
          {
            "id": "care_relationship",
            "text": "La omisión es problemática si deteriora la relación de confianza y deja sin escuchar necesidades que aparecen en el vínculo."
          },
          {
            "id": "distribution",
            "text": "La omisión es problemática si sus costos recaen sobre un grupo mientras los beneficios se concentran en otro."
          }
        ],
        "correctId": "instrumentalization",
        "hint": "La formulación de humanidad examina si las personas son tratadas como fines y si pueden reconocerse como agentes de la situación.",
        "why": "La clase señala que una persona no debe quedar reducida a herramienta de un fin ajeno. Si se omite información capaz de cambiar su decisión, no puede evaluar suficientemente su participación ni reconocerse plenamente como agente de la situación.",
        "source": {
          "label": "Sesión 4 · Humanidad como fin",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/humanidad-como-fin"
        },
        "sourceTerms": [
          "humanidad como fin",
          "nunca simplemente como medio",
          "agente de la situación"
        ]
      }
    ]
  },
  "utilitarismo": {
    "id": "utilitarismo",
    "version": 8,
    "no": "04",
    "title": "Utilitarismo",
    "short": "Mill y las consecuencias",
    "desc": "Consecuencias, bienestar, imparcialidad, calidad y distribución.",
    "questions": [
      {
        "id": "util-criterio-central",
        "version": 1,
        "tag": "Criterio utilitarista",
        "q": "¿Cuál afirmación representa mejor el criterio utilitarista presentado en la clase?",
        "options": [
          {
            "id": "welfare_all_affected",
            "text": "Comparar las alternativas por sus efectos sobre el bienestar de todas las personas que pueden resultar afectadas."
          },
          {
            "id": "follow_binding_rule",
            "text": "Identificar el deber que obliga en la situación y seguirlo aunque otra alternativa produzca mejores resultados."
          },
          {
            "id": "respond_relationships",
            "text": "Atender primero a las relaciones, dependencias y necesidades concretas que organizan la situación."
          },
          {
            "id": "express_good_character",
            "text": "Preguntar qué acción expresa mejor los hábitos y disposiciones propios de un carácter virtuoso."
          }
        ],
        "correctId": "welfare_all_affected",
        "hint": "En Mill, la pregunta se desplaza hacia las consecuencias y hacia el bienestar de quienes pueden ser afectados.",
        "why": "El utilitarismo evalúa los cursos de acción por sus efectos sobre el bienestar de quienes pueden ser afectados. La clase añade que una deliberación seria debe considerar daños, beneficios, intensidad, duración, incertidumbre y alternativas reales.",
        "source": {
          "label": "Sesión 4 · Mill y el principio de utilidad",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/mill-y-el-principio-de-utilidad"
        },
        "sourceTerms": [
          "principio de utilidad",
          "felicidad",
          "bienestar",
          "consecuencias"
        ]
      },
      {
        "id": "util-consecuencias-alternativas",
        "version": 2,
        "tag": "Consecuencias y alternativas",
        "case": "Un servicio debe escoger entre dos programas de apoyo. Ambos requieren recursos similares, pero sus efectos esperados son distintos y existe incertidumbre sobre parte de los resultados.",
        "q": "¿Qué comparación recoge mejor el análisis que la sesión propone realizar antes de decidir?",
        "options": [
          {
            "id": "effects_all",
            "text": "Comparar las consecuencias previsibles de las alternativas para todos los afectados, considerando también incertidumbre y distribución de cargas y beneficios."
          },
          {
            "id": "most_probable_only",
            "text": "Comparar sólo las consecuencias más probables de cada alternativa y dejar fuera los efectos inciertos para evitar introducir elementos especulativos."
          },
          {
            "id": "aggregate_without_distribution",
            "text": "Comparar el balance total de daños y beneficios de cada alternativa sin distinguir cómo se distribuyen, porque la agregación ya resume esa información."
          },
          {
            "id": "number_benefited_first",
            "text": "Comparar principalmente cuántas personas obtendrían algún beneficio de cada alternativa, aunque la intensidad y duración de los efectos sean distintas."
          }
        ],
        "correctId": "effects_all",
        "hint": "La sesión pide reconstruir consecuencias, alternativas e incertidumbre antes de decidir.",
        "why": "La deliberación utilitarista propuesta en la sesión considera a todos los afectados y reconstruye daños y beneficios previsibles, intensidad, duración y probabilidad de los efectos, alternativas reales, incertidumbre y distribución de cargas y beneficios.",
        "source": {
          "label": "Sesión 4 · Lo que Mill enseña a mirar",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/lo-que-mill-ense%C3%B1a-a-mirar"
        },
        "sourceTerms": [
          "afectados",
          "daños y beneficios",
          "intensidad",
          "duración",
          "alternativas reales"
        ]
      },
      {
        "id": "util-imparcialidad",
        "version": 1,
        "tag": "Imparcialidad",
        "q": "¿Qué expresa mejor la idea de imparcialidad presentada en la clase?",
        "options": [
          {
            "id": "equal_consideration",
            "text": "El bienestar de cada persona cuenta y los intereses propios o privilegiados no pesan más sólo por pertenecer a ciertos grupos."
          },
          {
            "id": "equal_outcomes",
            "text": "La imparcialidad exige que todas las personas reciban exactamente el mismo beneficio, cualquiera sea la alternativa evaluada."
          },
          {
            "id": "majority_priority",
            "text": "La imparcialidad exige dar prioridad al bienestar de la mayoría cuando existe un conflicto con grupos menos numerosos."
          },
          {
            "id": "legal_equality",
            "text": "La imparcialidad queda satisfecha cuando una misma norma jurídica se aplica formalmente a todas las personas afectadas."
          }
        ],
        "correctId": "equal_consideration",
        "hint": "La sesión define la imparcialidad indicando que cada bienestar cuenta al evaluar la acción.",
        "why": "La imparcialidad impide que intereses propios o privilegiados pesen más sólo por pertenecer a determinadas personas o grupos. No exige resultados idénticos ni convierte automáticamente a la mayoría en criterio decisivo.",
        "source": {
          "label": "Sesión 4 · Imparcialidad y agregación",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/imparcialidad-y-agregaci%C3%B3n"
        },
        "sourceTerms": [
          "cada bienestar cuenta",
          "imparcialidad",
          "intereses propios o privilegiados"
        ]
      },
      {
        "id": "util-calidad",
        "version": 2,
        "tag": "Cantidad y calidad",
        "case": "Dos actividades producen una cantidad parecida de satisfacción declarada. Una ofrece gratificación inmediata y la otra involucra pensamiento, imaginación, autonomía y formas de participación más complejas.",
        "q": "¿Qué consideración agrega Mill para comparar estas experiencias además de la cantidad de satisfacción?",
        "options": [
          {
            "id": "competent_judges",
            "text": "Considerar la calidad de las experiencias y la valoración de quienes conocen ambos tipos y están en condiciones de compararlos."
          },
          {
            "id": "equal_quantity",
            "text": "Tratar las experiencias como equivalentes cuando la cantidad total de satisfacción declarada sea aproximadamente la misma."
          },
          {
            "id": "immediate_preference",
            "text": "Preferir la experiencia que produzca satisfacción más inmediata, porque su efecto puede observarse con mayor facilidad."
          },
          {
            "id": "effort_is_superior",
            "text": "Preferir la experiencia más exigente, porque para Mill toda actividad intelectual tiene un valor superior por el solo hecho de requerir esfuerzo."
          }
        ],
        "correctId": "competent_judges",
        "hint": "Mill sostiene que la comparación no se agota en cuánto placer o satisfacción produce una experiencia.",
        "why": "Mill distingue entre cantidad y calidad. Los placeres superiores se vinculan con pensamiento, imaginación, afectos complejos, autonomía, cultura y una vida más rica. Quienes conocen ambos tipos de experiencia están en mejor posición para compararlos.",
        "source": {
          "label": "Sesión 4 · Cantidad y calidad",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/cantidad-y-calidad"
        },
        "sourceTerms": [
          "placeres inferiores",
          "placeres superiores",
          "jueces competentes"
        ]
      },
      {
        "id": "util-distribucion",
        "version": 2,
        "tag": "Agregación y distribución",
        "case": "Una política aumenta el bienestar total esperado, pero concentra un daño intenso y prolongado en un grupo pequeño. Existe otra alternativa con un beneficio algo menor y cargas menos concentradas.",
        "q": "¿Qué dificultad del análisis utilitarista aparece con mayor claridad en este caso?",
        "options": [
          {
            "id": "aggregation_can_hide_distribution",
            "text": "La agregación puede mostrar un balance favorable y, al mismo tiempo, ocultar cómo se reparten las cargas y los beneficios entre los afectados."
          },
          {
            "id": "impartiality_requires_no_harm",
            "text": "La imparcialidad obliga a descartar cualquier alternativa que produzca un daño intenso, aunque el balance general de bienestar sea mayor."
          },
          {
            "id": "uncertainty_blocks_comparison",
            "text": "La presencia de consecuencias inciertas impide comparar las alternativas hasta que todos sus efectos puedan conocerse con seguridad."
          },
          {
            "id": "quality_prevents_aggregation",
            "text": "La distinción entre placeres superiores e inferiores impide agregar efectos entre personas cuando las experiencias involucradas son diferentes."
          }
        ],
        "correctId": "aggregation_can_hide_distribution",
        "hint": "La sesión presenta una dificultad específica de la agregación cuando los efectos no recaen de la misma manera sobre todos.",
        "why": "La agregación combina efectos sobre muchas personas para juzgar cursos de acción, pero puede ocultar quién carga con los costos y quién recibe los beneficios. Por eso la distribución de cargas y beneficios también debe hacerse visible en la deliberación.",
        "source": {
          "label": "Sesión 4 · Imparcialidad y agregación",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/imparcialidad-y-agregaci%C3%B3n"
        },
        "sourceTerms": [
          "agregación",
          "quién carga con los costos",
          "quién recibe los beneficios",
          "todos los afectados"
        ]
      }
    ]
  },
  "cuidado": {
    "id": "cuidado",
    "version": 8,
    "no": "05",
    "title": "Ética del cuidado",
    "short": "Relaciones, necesidades y voz",
    "desc": "Relaciones, necesidades, dependencia, escucha y responsabilidad.",
    "questions": [
      {
        "id": "cuidado-criterio-central",
        "version": 1,
        "tag": "Criterio del cuidado",
        "q": "¿Qué aspecto ocupa un lugar central en la ética del cuidado presentada en la clase?",
        "options": [
          {
            "id": "relations_needs_responsibilities",
            "text": "Las relaciones concretas, las dependencias, las necesidades y las responsabilidades que aparecen en la situación."
          },
          {
            "id": "universal_rule_priority",
            "text": "Las reglas universales que pueden aplicarse del mismo modo con independencia de las relaciones particulares."
          },
          {
            "id": "aggregate_welfare_priority",
            "text": "El bienestar total producido por cada alternativa y la elección del resultado agregado más favorable."
          },
          {
            "id": "character_habits_priority",
            "text": "Los hábitos estables que forman el carácter y orientan a una persona hacia su realización plena."
          }
        ],
        "correctId": "relations_needs_responsibilities",
        "hint": "La clase lleva la atención hacia relaciones, dependencia, necesidades, responsabilidad y formas de escuchar.",
        "why": "La ética del cuidado hace visibles relaciones, dependencias, necesidades concretas, responsabilidades y voces que pueden quedar fuera. Estos elementos forman parte de la descripción moral del caso, no son un añadido posterior.",
        "source": {
          "label": "Sesión 4 · Lo que el cuidado enseña a mirar",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/lo-que-el-cuidado-ense%C3%B1a-a-mirar"
        },
        "sourceTerms": [
          "relaciones",
          "necesidades",
          "responsabilidad",
          "dependencia",
          "escucha"
        ]
      },
      {
        "id": "cuidado-que-mirar",
        "version": 1,
        "tag": "Lo que el cuidado enseña a mirar",
        "case": "Un equipo diseña una intervención para un grupo y define objetivos, tiempos y procedimientos sin incorporar la voz de quienes recibirán el apoyo.",
        "q": "¿Qué pregunta orienta con más claridad una lectura desde la ética del cuidado?",
        "options": [
          {
            "id": "voices_needs_relations",
            "text": "¿Qué relaciones y dependencias existen, qué necesidades están siendo escuchadas y quién puede quedar abandonado por la decisión?"
          },
          {
            "id": "universal_rule",
            "text": "¿Qué regla autoriza el procedimiento y podría sostenerse como norma común en cualquier situación semejante?"
          },
          {
            "id": "aggregate_results",
            "text": "¿Qué alternativa produce el mayor bienestar esperado al considerar los efectos sobre todas las personas afectadas?"
          },
          {
            "id": "legal_compliance",
            "text": "¿Qué procedimiento cumple con mayor precisión las normas institucionales y reduce el riesgo de incumplimiento profesional?"
          }
        ],
        "correctId": "voices_needs_relations",
        "hint": "La ética del cuidado pregunta por relaciones, dependencias, necesidades, asimetrías de poder y voces que pueden quedar silenciadas.",
        "why": "Una lectura desde el cuidado pregunta qué relaciones existen, quién depende de quién, qué necesidades se escuchan, qué asimetrías de poder organizan la situación y quién puede quedar expuesto o abandonado por la decisión.",
        "source": {
          "label": "Sesión 4 · Lo que el cuidado enseña a mirar",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/lo-que-el-cuidado-ense%C3%B1a-a-mirar"
        },
        "sourceTerms": [
          "relaciones",
          "dependencia",
          "necesidades",
          "asimetrías de poder",
          "abandonar"
        ]
      },
      {
        "id": "cuidado-caso-robo",
        "version": 1,
        "tag": "Escucha y contexto",
        "case": "Durante una sesión, un paciente cuenta que robó alimentos en un supermercado después de quedarse sin ingresos. La situación no implica un riesgo inmediato para terceros.",
        "q": "¿Cuál respuesta inicia mejor el análisis desde la ética del cuidado sin confundir comprensión con aprobación de la conducta?",
        "options": [
          {
            "id": "explore_context",
            "text": "Indagar la necesidad, el contexto y las relaciones implicadas antes de decidir qué responsabilidades aparecen en el trabajo clínico."
          },
          {
            "id": "moral_reprimand",
            "text": "Señalar de inmediato que la conducta fue incorrecta y orientar la conversación hacia el cumplimiento de las normas aplicables."
          },
          {
            "id": "universalize_theft",
            "text": "Preguntar qué ocurriría si todas las personas actuaran del mismo modo y examinar la regla que esa conducta autoriza."
          },
          {
            "id": "maximize_welfare",
            "text": "Comparar el beneficio obtenido por el paciente con los perjuicios producidos al supermercado y a otras personas afectadas."
          }
        ],
        "correctId": "explore_context",
        "hint": "Escuchar la experiencia y situarla en una historia de relaciones permite comprender necesidades y responsabilidades sin suspender el juicio profesional.",
        "why": "La ética del cuidado pide atender al contexto, las relaciones, las necesidades y las responsabilidades concretas. Comprender cómo aparece una conducta en esa situación no equivale a aprobarla; permite decidir después cómo responder sin borrar la experiencia de la persona.",
        "source": {
          "label": "Sesión 4 · La noción de voz",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/voz-gilligan"
        },
        "sourceTerms": [
          "escuchar",
          "contexto",
          "responsabilidad",
          "relaciones"
        ]
      },
      {
        "id": "cuidado-tronto",
        "version": 2,
        "tag": "Fases del cuidado",
        "case": "Un centro detecta que varias personas mayores no pueden asistir a controles. Identifica la necesidad y asigna responsables para responder, pero todavía no ha realizado ninguna acción concreta.",
        "q": "Según la secuencia presentada en la clase, ¿qué fase de Tronto viene a continuación?",
        "options": [
          {
            "id": "care_giving",
            "text": "Cuidar, realizando una acción concreta con competencia y con los recursos adecuados para responder a la necesidad."
          },
          {
            "id": "caring_about",
            "text": "Atender nuevamente, para determinar si la necesidad existe antes de asumir responsabilidad por responder a ella."
          },
          {
            "id": "care_receiving",
            "text": "Recibir respuesta, preguntando cómo viven la intervención las personas cuidadas antes de realizar una acción concreta."
          },
          {
            "id": "caring_with",
            "text": "Cuidar con otros, organizando primero la responsabilidad democrática antes de realizar una respuesta concreta."
          }
        ],
        "correctId": "care_giving",
        "hint": "Después de atender una necesidad y hacerse cargo de responder, la secuencia pasa a realizar una acción concreta.",
        "why": "El centro ya advirtió la necesidad y asumió responsabilidad por responder. La fase siguiente es cuidar, es decir, realizar una acción concreta con competencia y recursos adecuados.",
        "source": {
          "label": "Sesión 4 · Las fases del cuidado en Tronto",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/tronto-fases"
        },
        "sourceTerms": [
          "atender",
          "hacerse cargo",
          "cuidar",
          "recibir respuesta",
          "cuidar con otros"
        ]
      },
      {
        "id": "cuidado-gilligan",
        "version": 1,
        "tag": "Gilligan y la noción de voz",
        "case": "Una pauta de evaluación considera más madura cualquier respuesta que abstrae relaciones particulares y razona desde principios impersonales.",
        "q": "¿Cuál crítica representa mejor el problema señalado por Gilligan?",
        "options": [
          {
            "id": "other_voices",
            "text": "La pauta toma una forma de razonamiento como medida de madurez y puede dejar en segundo plano relaciones y responsabilidades concretas."
          },
          {
            "id": "invert_hierarchy",
            "text": "La pauta debería invertir la jerarquía y considerar más madura toda respuesta que privilegie el cuidado sobre la justicia."
          },
          {
            "id": "gender_rules",
            "text": "La pauta debería usar criterios distintos para hombres y mujeres, porque cada grupo desarrolla de manera natural una moral diferente."
          },
          {
            "id": "abstract_is_best",
            "text": "La pauta es adecuada porque abstraer relaciones particulares permite reconocer la única forma madura de razonamiento moral."
          }
        ],
        "correctId": "other_voices",
        "hint": "Gilligan cuestiona que una forma de razonamiento funcione como medida completa de madurez moral y deje otras voces en una posición subordinada.",
        "why": "Gilligan no propone invertir la jerarquía ni afirmar que mujeres y hombres razonan de manera naturalmente distinta. Su crítica señala que una teoría puede privilegiar el lenguaje abstracto de justicia y escuchar peor formas de razonamiento ligadas a relaciones, responsabilidad y cuidado.",
        "source": {
          "label": "Sesión 4 · Qué afirma Gilligan y qué conviene evitar",
          "href": "../sesiones/S4%20-%20Deontolog%C3%ADa%2C%20Utilitarismo%20y%20Cuidado.html#/qu%C3%A9-afirma-gilligan-y-qu%C3%A9-conviene-evitar"
        },
        "sourceTerms": [
          "relaciones",
          "responsabilidad",
          "cuidado",
          "otras voces",
          "justicia abstracta"
        ]
      }
    ]
  }
};
