import { ExpeditionBlueprint } from "../types";

export const PLASSEY_1757_BLUEPRINT: ExpeditionBlueprint = {
  id: "plassey_1757",
  keywords: [
    "plassey",
    "battle of plassey",
    "trade to territory",
    "from trade to territory",
    "bengal 1757",
    "1757",
    "siraj",
    "siraj-ud-daulah",
    "clive",
    "robert clive",
    "mir jafar",
    "palashi"
  ],
  title: "From Trade to Territory — Battle of Plassey",
  era: "British East India Company / Bengal Subah",
  year: "1757",
  location: "Plassey (Palashi), Bengal",
  world: {
    metadata: {
      id: "exp_plassey_1757",
      title: "From Trade to Territory — Battle of Plassey",
      era: "British East India Company / Bengal Subah",
      year: "1757",
      location: "Plassey (Palashi), Bengal",
      summary: "June 1757, Bengal. You are a young administrative messenger navigating the rising tensions between Nawab Siraj-ud-Daulah and Robert Clive's East India Company. Uncover how trade turned into territorial ambition through political division, military intervention, and secret alliances.",
      archetype: "POLITICAL_INTRIGUE",
      difficulty: "Intermediate",
      estimatedPlaytimeMinutes: 15,
      createdAt: new Date().toISOString()
    },
    historicalContext: {
      factualBackground: "In June 1757, the Battle of Plassey took place near the Bhagirathi River in Bengal. The British East India Company, led by Robert Clive, confronted Nawab Siraj-ud-Daulah. Though outnumbered, Clive's victory was secured by internal political divisions and a secret alliance with Mir Jafar, commander-in-chief of the Nawab's army.",
      keyFigures: [
        "Nawab Siraj-ud-Daulah (Nawab of Bengal)",
        "Robert Clive (East India Company Commander)",
        "Mir Jafar (Commander-in-Chief of Bengal forces)",
        "Jagat Seth (Mahtab Rai & Swarup Chand - Murshidabad Bankers)",
        "William Watts (East India Company Representative)"
      ],
      primarySourcesReferenced: [
        "Records of the Fort William Council (1757)",
        "Memoirs of Robert Clive",
        "Siyar-ul-Mutakherin by Syed Ghulam Husain Khan",
        "Bengal Public Consultations (British Library)"
      ],
      historicalMythsDebunked: [
        "Myth: The Battle of Plassey was a straightforward, mass military conquest won by sheer force of arms.",
        "Fact: Plassey was decided largely through political negotiations, internal army factions, and secret agreements before the main engagement began."
      ]
    },
    visualBible: {
      artStyle: "Historical 2.5D Pixel RPG",
      colorPalette: ["Sandstone Ochre", "Monsoon Emerald", "Deep Indigo", "Royal Crimson", "Gold"],
      architecturalStyle: "18th Century Bengal Marquee, Fort Gate & Brick Residency",
      lightingAtmosphere: "Tense Heavy Monsoon Twilight",
      timeOfDay: "Late Afternoon",
      weather: "Monsoon Rain Haze"
    },
    narratorOpening: "June 1757. Deep in the lush province of Bengal, dark pre-monsoon storm clouds hang low over the mango groves of Palashi. You are a young Bengal administrative messenger. The East India Company—which arrived decades ago strictly to trade silk and spices—now gathers soldiers and fortifications. Journey through camp, bazaar, and court to uncover how commercial ambition is turning into territorial power.",
    scenes: [
      {
        id: "scene_company_camp",
        name: "Scene 1: Entry / Company Camp",
        templateId: "fort_gate",
        visualDescription: "The fortified wooden and brick entrance to the East India Company's encampment in Bengal, guarded by sentries holding muskets near stacks of shipping crates.",
        imagePrompt: "Create a historically grounded 2.5D Indian RPG environment of an 18th-century East India Company military camp entrance in Bengal 1757, earthen ground, wooden defensive structures, period tents, Company soldiers in redcoat uniforms holding period muskets, supply crates, cloth banners without readable text, humid Bengal atmosphere with lush tropical vegetation beyond camp, clear playable foreground, open movement area, 2.5D side perspective, no modern objects, no text",
        spawnPoint: { x: 30, y: 82 },
        npcs: [
          { npcId: "char_company_guard", x: 36, y: 66 },
          { npcId: "char_camp_clerk", x: 74, y: 68 }
        ],
        objects: [
          {
            id: "obj_company_trade_ledger",
            name: "Company Trade Ledger",
            interactionText: "Inspect Company Trade Ledger",
            clueId: "ev_trading_charter",
            x: 64,
            y: 72
          }
        ],
        exits: [
          {
            id: "ex_scene1_to_scene2",
            targetSceneId: "scene_camp_rumours",
            label: "Enter Camp Courtyard",
            triggerArea: { minX: 24, maxX: 36, minY: 55, maxY: 72 },
            targetSpawn: { x: 12, y: 80 }
          }
        ],
        narratorEvents: [
          {
            id: "ne_1",
            triggerType: "SCENE_ENTER",
            text: "You approach the Company camp checkpoint. Guards watch suspiciously. To enter, you must prove your understanding of why the British arrived in Bengal.",
            tone: "informative"
          }
        ]
      },
      {
        id: "scene_camp_rumours",
        name: "Scene 2: Military Camp / Overheard Rumours",
        templateId: "fort_courtyard",
        visualDescription: "An inner courtyard filled with supply wagons, rain-drenched tents, and soldiers huddled in conversation about the coming confrontation with Siraj-ud-Daulah.",
        imagePrompt: "Create a historically grounded 2.5D Indian RPG environment of an 18th-century military camp interior in Bengal 1757, soldiers, supply wagons, rain-drenched canvas tents, wooden palisades, period firearms, merchant activity, messenger movement, humid tropical monsoon rain environment, military preparation and political tension, clear playable foreground, open movement area, 2.5D side perspective, no modern objects, no text",
        spawnPoint: { x: 15, y: 80 },
        npcs: [
          { npcId: "char_company_soldier", x: 30, y: 75 },
          { npcId: "char_bengal_merchant", x: 55, y: 70 },
          { npcId: "char_camp_clerk", x: 78, y: 72 }
        ],
        objects: [
          {
            id: "obj_bengal_trade_goods",
            name: "Bengal Trade Goods",
            interactionText: "Inspect Bengal Trade Goods",
            clueId: "ev_camp_rumours",
            x: 42,
            y: 82
          }
        ],
        exits: [
          {
            id: "ex_scene2_to_scene1",
            targetSceneId: "scene_company_camp",
            label: "Return to Camp Entrance",
            triggerArea: { minX: 0, maxX: 16, minY: 40, maxY: 95 },
            targetSpawn: { x: 30, y: 82 }
          },
          {
            id: "ex_scene2_to_scene3",
            targetSceneId: "scene_bengal_bazaar",
            label: "Walk to Bengal Market",
            triggerArea: { minX: 84, maxX: 100, minY: 40, maxY: 95 },
            targetSpawn: { x: 12, y: 80 }
          }
        ],
        narratorEvents: [
          {
            id: "ne_2",
            triggerType: "SCENE_ENTER",
            text: "Listen closely to the camp conversations. Whispers speak of deep factional divisions within the Nawab's military command.",
            tone: "mysterious"
          }
        ]
      },
      {
        id: "scene_bengal_bazaar",
        name: "Scene 3: Bengal Culture / Social Interlude",
        templateId: "bazaar",
        visualDescription: "A bustling 18th-century Bengal market square with thatched awnings, vibrant silk bolts, spice sacks, and merchants conducting commerce.",
        imagePrompt: "Create a historically grounded 2.5D Indian RPG environment of a busy 18th-century Bengal bazaar market around 1757, silk textiles hanging from wooden stalls, cloth merchants, spice sacks, metal vessels, account books, weighing equipment, local traders in period attire, 18th-century Bengal brick and plaster architecture, clear playable central movement area, 2.5D side perspective, no modern objects, no readable signs, no text",
        spawnPoint: { x: 15, y: 80 },
        npcs: [
          { npcId: "char_bengal_merchant", x: 35, y: 75 },
          { npcId: "char_artisan", x: 70, y: 72 }
        ],
        objects: [
          {
            id: "obj_weighing_scale",
            name: "Weighing Scale & Goods",
            interactionText: "Inspect Weighing Scale",
            clueId: "ev_bengal_trade_ledger",
            x: 52,
            y: 82
          }
        ],
        exits: [
          {
            id: "ex_scene3_to_scene2",
            targetSceneId: "scene_camp_rumours",
            label: "Return to Military Camp",
            triggerArea: { minX: 0, maxX: 16, minY: 40, maxY: 95 },
            targetSpawn: { x: 88, y: 80 }
          },
          {
            id: "ex_scene3_to_scene4",
            targetSceneId: "scene_political_investigation",
            label: "Enter Political Chamber",
            triggerArea: { minX: 84, maxX: 100, minY: 40, maxY: 95 },
            targetSpawn: { x: 12, y: 80 }
          }
        ],
        narratorEvents: [
          {
            id: "ne_3",
            triggerType: "SCENE_ENTER",
            text: "Beyond military camps lies the heart of Bengal: a wealth of trade, cotton, silk, and spices that made this province the commercial jewel of India.",
            tone: "informative"
          }
        ]
      },
      {
        id: "scene_political_investigation",
        name: "Scene 4: Political Investigation",
        templateId: "palace_interior",
        visualDescription: "An administrative hall with Persian carpets, carved archways, diplomatic letters, and maps of Bengal spread across low teak tables.",
        imagePrompt: "Create a historically grounded 2.5D Indian RPG environment of an 18th-century Bengal elite administrative interior in 1757, arched Mughal-style architecture, carved stone pillars, Persian carpets, low wooden furniture, parchment diplomatic documents, brass oil lamps, period textiles, view into quiet courtyard, formal quiet atmosphere of political tension, 2.5D side perspective, no modern objects, no text",
        spawnPoint: { x: 50, y: 88 },
        npcs: [
          { npcId: "char_camp_clerk", x: 25, y: 65 },
          { npcId: "char_court_official", x: 50, y: 54 },
          { npcId: "char_clive", x: 72, y: 65 }
        ],
        objects: [
          {
            id: "obj_bengal_military_map_4",
            name: "Bengal Military Map",
            interactionText: "Inspect Bengal Military Map",
            clueId: "ev_power_balance_doc",
            x: 43,
            y: 72
          },
          {
            id: "obj_sealed_political_letter_4",
            name: "Sealed Political Letter",
            interactionText: "Read Political Letter",
            clueId: "ev_secret_treaty",
            x: 60,
            y: 72
          }
        ],
        exits: [
          {
            id: "ex_scene4_to_scene3",
            targetSceneId: "scene_bengal_bazaar",
            label: "Walk to Return to Market",
            triggerArea: { minX: 0, maxX: 16, minY: 40, maxY: 95 },
            targetSpawn: { x: 88, y: 80 }
          },
          {
            id: "ex_scene4_to_scene5",
            targetSceneId: "scene_court_investigation",
            label: "Walk to Enter Royal Court ➔",
            triggerArea: { minX: 84, maxX: 100, minY: 40, maxY: 95 },
            targetSpawn: { x: 12, y: 80 }
          }
        ],
        narratorEvents: [
          {
            id: "ne_4",
            triggerType: "SCENE_ENTER",
            text: "Here, statecraft takes center stage. You must analyze why a trading company with a smaller army could pose such a formidable challenge.",
            tone: "informative"
          }
        ]
      },
      {
        id: "scene_court_investigation",
        name: "Scene 5: Court / Alliance Investigation",
        templateId: "throne_room",
        visualDescription: "The grand audience hall of Bengal in Murshidabad, with silk drapery, velvet cushions, and marble columns where Nawab Siraj-ud-Daulah and his generals deliberate.",
        imagePrompt: "Create a historically grounded 2.5D Indian RPG environment of an 18th-century Bengal court interior in 1757, Nawab-era architecture, ornamental carved pillars, crimson carpets, low velvet throne cushion, brass lamps, court furniture, administrative documents, plausible historical realism, 2.5D side perspective, no modern objects, no text",
        spawnPoint: { x: 50, y: 88 },
        npcs: [
          { npcId: "char_siraj", x: 50, y: 60 },
          { npcId: "char_jafar", x: 50, y: 72 },
          { npcId: "char_court_official", x: 24, y: 74 },
          { npcId: "char_clive", x: 76, y: 74 }
        ],
        objects: [
          {
            id: "obj_sealed_political_letter_5",
            name: "Sealed Political Letter",
            interactionText: "Read Secret Alliance Letter",
            clueId: "ev_secret_treaty",
            x: 30,
            y: 76
          },
          {
            id: "obj_military_map_5",
            name: "Bengal Military Map",
            interactionText: "Examine Bengal Military Map",
            clueId: "ev_power_balance_doc",
            x: 70,
            y: 76
          }
        ],
        exits: [
          {
            id: "ex_scene5_to_scene4",
            targetSceneId: "scene_political_investigation",
            label: "Walk to Return to Political Chamber",
            triggerArea: { minX: 0, maxX: 16, minY: 40, maxY: 95 },
            targetSpawn: { x: 88, y: 80 }
          },
          {
            id: "ex_scene5_to_scene6",
            targetSceneId: "scene_aftermath",
            label: "Walk to Proceed to Plassey ➔",
            triggerArea: { minX: 84, maxX: 100, minY: 40, maxY: 95 },
            targetSpawn: { x: 12, y: 80 }
          }
        ],
        narratorEvents: [
          {
            id: "ne_5",
            triggerType: "SCENE_ENTER",
            text: "You stand in the royal court. Below the surface of courtly protocol, secret pacts are being signed that will alter the destiny of Bengal.",
            tone: "dramatic"
          }
        ]
      },
      {
        id: "scene_aftermath",
        name: "Scene 6: Battlefield Aftermath / Historical Revelation",
        templateId: "garden",
        visualDescription: "The quiet mango groves of Palashi after the confrontation, damp from monsoon rain, with historic flags fluttering as rain mist settles over the field.",
        imagePrompt: "Create a historically grounded 2.5D Indian RPG environment of the quiet Bengal landscape after the Battle of Plassey in 1757, humid Bengal environment, ancient mango orchard trees, open field, distant rain haze, remnants of period military tents, late afternoon light, reflective historical mood, no graphic violence, no corpses, no modern objects, no text, 2.5D side perspective",
        spawnPoint: { x: 15, y: 80 },
        npcs: [
          { npcId: "char_company_soldier", x: 35, y: 75 },
          { npcId: "char_narrator_observer", x: 65, y: 72 }
        ],
        objects: [
          {
            id: "obj_musket_equipment",
            name: "Musket & Military Equipment",
            interactionText: "Inspect Musket & Equipment",
            clueId: "ev_plassey_aftermath_fact",
            x: 50,
            y: 80
          }
        ],
        exits: [
          {
            id: "ex_scene6_to_scene5",
            targetSceneId: "scene_court_investigation",
            label: "Return to Royal Court",
            triggerArea: { minX: 0, maxX: 16, minY: 40, maxY: 95 },
            targetSpawn: { x: 88, y: 80 }
          }
        ],
        narratorEvents: [
          {
            id: "ne_6",
            triggerType: "SCENE_ENTER",
            text: "The confrontation at Plassey on June 23, 1757 has concluded. Arrange the sequence of historical developments to complete your investigation.",
            tone: "informative"
          }
        ]
      }
    ],
    characters: [
      {
        id: "char_clive",
        name: "Robert Clive",
        title: "Company Commander",
        historicalRole: "Commander of East India Company Forces at Plassey",
        personality: "Calculated, resolute, and strategically ambitious",
        spriteType: "noble",
        characterImagePrompt: "Create a 2.5D RPG character portrait of 18th-century British commander Robert Clive in 1757, redcoat military uniform, gold braid trim, tricorne hat, holding field telescope, game character portrait, neutral background, no text",
        initialDialogue: "Victory is forged in preparation long before battle begins. The fate of Bengal will be decided on our terms.",
        historicalFacts: [
          "Robert Clive commanded 3,000 men at Plassey against Siraj-ud-Daulah's 50,000 troops.",
          "He negotiated the Secret Treaty of Plassey with Mir Jafar and Jagat Seth bankers."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "Victory is forged in preparation long before battle begins. The fate of Bengal will be decided on our terms.",
            options: [
              {
                id: "o1",
                text: "How do you intend to overcome the Nawab's superior numbers?",
                nextDialogueId: "n2"
              }
            ]
          },
          {
            id: "n2",
            prompt: "Numbers mean little when strategic positioning and diplomatic alliances align. Observe how history unfolds.",
            options: [
              {
                id: "o2",
                text: "Acknowledge his command strategy."
              }
            ]
          }
        ]
      },
      {
        id: "char_company_guard",
        name: "Company Guard",
        title: "Fort Gate Sentry",
        historicalRole: "East India Company Camp Checkpoint Sentry",
        personality: "Vigilant, direct, and protective",
        spriteType: "guard",
        characterImagePrompt: "Create a 2.5D RPG character portrait of an 18th-century East India Company sentry guard in 1757, redcoat military jacket, white crossbelts, tricorne hat, holding musket, game character portrait",
        initialDialogue: "Halt! Who goes there? This is an East India Company military area. State your knowledge of why our Company operates in Bengal!",
        historicalFacts: [
          "The East India Company established fortified posts like Fort William in Kolkata to protect commercial interests.",
          "By the 1750s, Company guards were increasingly deployed in political rivalries across Bengal."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "Halt! Who goes there? This is an East India Company military area. State your knowledge of why our Company operates in Bengal!",
            options: [
              {
                id: "o1",
                text: "I am a Bengal administrative messenger. Let me present my understanding of the Company's original purpose.",
                nextDialogueId: "n2"
              }
            ]
          },
          {
            id: "n2",
            prompt: "Very well, messenger. Answer correctly: What was the original primary role of the East India Company when it arrived in India?",
            options: [
              {
                id: "o2",
                text: "Answer the Checkpoint Question.",
                completesObjectiveId: "obj_scene1_talk"
              }
            ]
          }
        ]
      },
      {
        id: "char_camp_clerk",
        name: "Camp Clerk",
        title: "Company Record Keeper",
        historicalRole: "Commercial & Logistics Administrator",
        personality: "Analytical, methodical, and observant",
        spriteType: "scholar",
        characterImagePrompt: "Create a 2.5D RPG character portrait of an 18th-century administrative camp clerk in 1757, waistcoat, spectacles, holding quill and ledger, game character portrait",
        initialDialogue: "Ledgers and trade receipts tell the true story. What began as spice and silk trading has gradually become military expenditure.",
        historicalFacts: [
          "The Company maintained extensive trade records detailing exports of Bengal silk, cotton, saltpetre, and opium.",
          "Over time, military expenditures rivalled commercial investments in Company accounting."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "Ledgers and trade receipts tell the true story. What began as spice and silk trading has gradually become military expenditure.",
            options: [
              {
                id: "o1",
                text: "How did trade lead to military fortifications?",
                nextDialogueId: "n2"
              }
            ]
          },
          {
            id: "n2",
            prompt: "When rivalry with rival trading entities and regional conflicts escalated, commercial posts were converted into fortified strongholds.",
            options: [
              {
                id: "o2",
                text: "Thank you for the insight.",
                grantsEvidenceId: "ev_trading_charter"
              }
            ]
          }
        ]
      },
      {
        id: "char_company_soldier",
        name: "Company Soldier",
        title: "Infantry Grenadier",
        historicalRole: "British Field Soldier",
        personality: "Nervous, practical, and outspoken",
        spriteType: "guard",
        characterImagePrompt: "Create a 2.5D RPG character portrait of an 18th-century infantry soldier in 1757 Bengal, worn redcoat coat, damp weather hat, practical soldier expression, game character portrait",
        initialDialogue: "The pre-monsoon rains make our muskets damp, but the real talk in camp is about the Nawab's commanders. Word is, not everyone on the field intends to fight.",
        historicalFacts: [
          "Robert Clive's force at Plassey consisted of roughly 3,000 men compared to Siraj-ud-Daulah's army of over 50,000.",
          "British commanders counted heavily on internal defections within the Nawab's rank."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "The pre-monsoon rains make our muskets damp, but the real talk in camp is about the Nawab's commanders. Word is, not everyone on the field intends to fight.",
            options: [
              {
                id: "o1",
                text: "What rumours are you hearing about the Nawab's army?",
                nextDialogueId: "n2"
              }
            ]
          },
          {
            id: "n2",
            prompt: "They say Mir Jafar commands the largest division, yet secret messengers have been riding between his tent and ours all week!",
            options: [
              {
                id: "o2",
                text: "Record this camp rumour.",
                grantsEvidenceId: "ev_camp_rumours",
                completesObjectiveId: "obj_scene2_rumours"
              }
            ]
          }
        ]
      },
      {
        id: "char_bengal_merchant",
        name: "Bengal Merchant",
        title: "Murshidabad Trader",
        historicalRole: "Local Textile & Currency Merchant",
        personality: "Observant, cautious, and pragmatic",
        spriteType: "merchant",
        characterImagePrompt: "Create a 2.5D RPG character portrait of an 18th-century Bengal merchant in 1757, fine muslin turban, silk shawl, shrewd calculating expression, game character portrait",
        initialDialogue: "War is bad for trade. But when the Nawab clashed with the Company over customs duties, the great bankers took notice.",
        historicalFacts: [
          "Nawab Siraj-ud-Daulah opposed the Company's unauthorized fortification of Fort William and misuse of duty-free trade permits (dastaks).",
          "Prominent Bengal merchants and bankers feared economic instability under conflict."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "War is bad for trade. But when the Nawab clashed with the Company over customs duties, the great bankers took notice.",
            options: [
              {
                id: "o1",
                text: "Who are the bankers you speak of?",
                nextDialogueId: "n2"
              }
            ]
          },
          {
            id: "n2",
            prompt: "The Jagat Seth family of Murshidabad. They control the mint and credit of Bengal—their support sways kings and companies alike.",
            options: [
              {
                id: "o2",
                text: "Acknowledge the commercial reality.",
                grantsEvidenceId: "ev_bengal_trade_ledger"
              }
            ]
          }
        ]
      },
      {
        id: "char_political_observer",
        name: "Political Intermediary",
        title: "Court Emissary",
        historicalRole: "Diplomatic Envoy between Murshidabad & Kolkata",
        personality: "Careful, evasive, and diplomatic",
        spriteType: "noble",
        characterImagePrompt: "Create a 2.5D RPG character portrait of an 18th-century Bengal court envoy in 1757, embroidered angarkha coat, polished demeanor, game character portrait",
        initialDialogue: "In times of tension, words carry more weight than bullets. The alliance formed off the battlefield determines who rules tomorrow.",
        historicalFacts: [
          "Diplomatic emissaries like William Watts worked covertly in Murshidabad to secure agreements with dissatisfied court factions."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "In times of tension, words carry more weight than bullets. The alliance formed off the battlefield determines who rules tomorrow.",
            options: [
              {
                id: "o1",
                text: "Will the battle be decided by numbers or negotiations?",
                nextDialogueId: "n2"
              }
            ]
          },
          {
            id: "n2",
            prompt: "History will record the field of Plassey, but secret signatures in Murshidabad have already weighed the balance.",
            options: [
              {
                id: "o2",
                text: "Thank you for your counsel."
              }
            ]
          }
        ]
      },
      {
        id: "char_silk_merchant",
        name: "Silk Merchant",
        title: "Master Weaver & Trader",
        historicalRole: "Bengal Textile Exporter",
        personality: "Knowledgeable, proud of craft, pragmatic",
        spriteType: "merchant",
        characterImagePrompt: "Create a 2.5D RPG character portrait of an 18th-century Bengal silk merchant in 1757, vibrant yellow turban, holding fine woven silk textile, game character portrait",
        initialDialogue: "Bengal's silk and fine cotton muslin are prized across Europe and Asia. Commerce is our strength, yet foreign trading posts grow more demanding each year.",
        historicalFacts: [
          "Bengal produced over 30% of the world's textile trade during the mid-18th century.",
          "The East India Company sought monopoly rights over Bengal trade to maximize European profits."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "Bengal's silk and fine cotton muslin are prized across Europe and Asia. Commerce is our strength, yet foreign trading posts grow more demanding each year.",
            options: [
              {
                id: "o1",
                text: "Which trade goods were most central to Bengal's commercial importance?",
                nextDialogueId: "n2"
              }
            ]
          },
          {
            id: "n2",
            prompt: "Textiles, spices, and saltpetre! Examine our market ledgers to understand how trade drew foreign powers to our shores.",
            options: [
              {
                id: "o2",
                text: "Examine the market trade items.",
                completesObjectiveId: "obj_scene3_market"
              }
            ]
          }
        ]
      },
      {
        id: "char_artisan",
        name: "Brass Artisan",
        title: "Metal Worker",
        historicalRole: "Local Bengal Craftsman",
        personality: "Hardworking, observant, grounded",
        spriteType: "citizen",
        characterImagePrompt: "Create a 2.5D RPG character portrait of an 18th-century Bengal artisan in 1757, simple linen vest, holding brass lamp, warm expression, game character portrait",
        initialDialogue: "We craft oil lamps and cooking vessels for the market. But lately, orders for iron fittings and gun metal have doubled.",
        historicalFacts: [
          "Local metal artisans were employed by both regional rulers and foreign companies as military preparation intensified."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "We craft oil lamps and cooking vessels for the market. But lately, orders for iron fittings and gun metal have doubled.",
            options: [
              {
                id: "o1",
                text: "Does the market feel the threat of conflict?",
                nextDialogueId: "n2"
              }
            ]
          },
          {
            id: "n2",
            prompt: "Everyone feels it. When merchants stop buying silk and start buying arms, power is shifting.",
            options: [
              {
                id: "o2",
                text: "Return to investigation."
              }
            ]
          }
        ]
      },
      {
        id: "char_traveller",
        name: "River Traveller",
        title: "Bhagirathi Boatman",
        historicalRole: "River Navigator & Reporter",
        personality: "Widely travelled, perceptive",
        spriteType: "citizen",
        characterImagePrompt: "Create a 2.5D RPG character portrait of an 18th-century Bengal boatman in 1757, conical straw hat, indigo tunic, game character portrait",
        initialDialogue: "I row between Kolkata, Hooghly, and Murshidabad. British ships carrying field artillery sail upriver while royal messengers ride downriver.",
        historicalFacts: [
          "The Bhagirathi River was the vital transport corridor for military movement and trade in 18th-century Bengal."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "I row between Kolkata, Hooghly, and Murshidabad. British ships carrying field artillery sail upriver while royal messengers ride downriver.",
            options: [
              {
                id: "o1",
                text: "What did you observe near Plassey?",
                nextDialogueId: "n2"
              }
            ]
          },
          {
            id: "n2",
            prompt: "Heavy rain clouds gather over Palashi mango groves. Both armies assemble near the riverbank.",
            options: [
              {
                id: "o2",
                text: "Note the strategic location."
              }
            ]
          }
        ]
      },
      {
        id: "char_resident",
        name: "Local Resident",
        title: "Village Elder",
        historicalRole: "Bengal Villager",
        personality: "Wise, calm, cautious",
        spriteType: "citizen",
        characterImagePrompt: "Create a 2.5D RPG character portrait of an 18th-century elder resident of Bengal in 1757, cotton shawl, serene wise demeanor, game character portrait",
        initialDialogue: "Rulers come and go, but when a foreign merchant company raises an army, the order of the land changes.",
        historicalFacts: [
          "The transition from Mughal Subah administration to Company rule altered taxation and land revenue collection across Bengal."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "Rulers come and go, but when a foreign merchant company raises an army, the order of the land changes.",
            options: [
              {
                id: "o1",
                text: "How do the people view the Company's rise?",
                nextDialogueId: "n2"
              }
            ]
          },
          {
            id: "n2",
            prompt: "With great uncertainty. Trade brought wealth, but military intervention brings foreign rule.",
            options: [
              {
                id: "o2",
                text: "Reflect on their perspective."
              }
            ]
          }
        ]
      },
      {
        id: "char_siraj",
        name: "Siraj-ud-Daulah",
        title: "Nawab of Bengal",
        historicalRole: "Ruler of Bengal, Bihar, and Odisha (1756-1757)",
        personality: "Proud, resolute, fiercely defensive of Bengal's sovereignty",
        spriteType: "noble",
        characterImagePrompt: "Create a 2.5D RPG character portrait of Nawab Siraj-ud-Daulah in 1757, royal emerald angarkha, gold embroidered turban, dignified resolute ruler expression, game character portrait",
        initialDialogue: "The East India Company abuses its trade permits and builds unauthorized fortifications in our realm. Bengal's sovereignty shall not be dictated by foreign merchants!",
        historicalFacts: [
          "Siraj-ud-Daulah became Nawab of Bengal in April 1756 at age 23 following the death of his grandfather Alivardi Khan.",
          "He marched on Fort William in 1756 to enforce royal authority and curb unauthorized British fortifications."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "The East India Company abuses its trade permits and builds unauthorized fortifications in our realm. Bengal's sovereignty shall not be dictated by foreign merchants!",
            options: [
              {
                id: "o1",
                text: "Your Excellency, how do you view the Company's military build-up?",
                nextDialogueId: "n2"
              },
              {
                id: "o2",
                text: "Are you confident in the unity of your commanders?",
                nextDialogueId: "n3"
              }
            ]
          },
          {
            id: "n2",
            prompt: "Their military forces exceed any commercial purpose! They seek political leverage over our court and revenue.",
            options: [
              {
                id: "o3",
                text: "Inquire further about court unity.",
                nextDialogueId: "n3"
              }
            ]
          },
          {
            id: "n3",
            prompt: "Our army has superior numbers on the field at Palashi. Yet treason in high places is a poison more dangerous than cannons.",
            options: [
              {
                id: "o4",
                text: "Examine the political evidence in court.",
                completesObjectiveId: "obj_scene5_court"
              }
            ]
          }
        ]
      },
      {
        id: "char_jafar",
        name: "Mir Jafar",
        title: "Commander-in-Chief",
        historicalRole: "Senior Bengal Military Commander",
        personality: "Calculated, evasive, and politically ambitious",
        spriteType: "noble",
        characterImagePrompt: "Create a 2.5D RPG character portrait of Mir Jafar in 1757, 18th-century Bengal general attire, jewelled turban, stern calculating gaze, game character portrait",
        initialDialogue: "A general must consider every outcome. A battle is not merely fought with swords, but with strategic foresight.",
        historicalFacts: [
          "Mir Jafar commanded the largest wing of Siraj-ud-Daulah's army (nearly 35,000 troops) at Plassey.",
          "He made a secret agreement with Robert Clive and William Watts to remain inactive during the battle in exchange for being made Nawab."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "A general must consider every outcome. A battle is not merely fought with swords, but with strategic foresight.",
            options: [
              {
                id: "o1",
                text: "Why are your divisions positioned away from active engagement?",
                nextDialogueId: "n2"
              },
              {
                id: "o2",
                text: "Have you reached an understanding with the Company emissaries?",
                nextDialogueId: "n3"
              }
            ]
          },
          {
            id: "n2",
            prompt: "I hold my troops in reserve to preserve order. A wise commander waits for the decisive moment.",
            options: [
              {
                id: "o3",
                text: "Ask about the secret emissaries.",
                nextDialogueId: "n3"
              }
            ]
          },
          {
            id: "n3",
            prompt: "What passes between diplomats and generals is matters of state. Look to the treaty sealed with William Watts if you seek answers.",
            options: [
              {
                id: "o4",
                text: "Uncover the secret treaty document.",
                grantsEvidenceId: "ev_secret_treaty"
              }
            ]
          }
        ]
      },
      {
        id: "char_court_official",
        name: "Court Minister",
        title: "Subah Advisor",
        historicalRole: "Bengal Royal Court Minister",
        personality: "Cautious, observant, formal",
        spriteType: "noble",
        characterImagePrompt: "Create a 2.5D RPG character portrait of an 18th-century Bengal court minister in 1757, gold angarkha, formal court demeanor, game character portrait",
        initialDialogue: "The treasury is burdened and the court is divided. When internal factionalism meets external commercial power, the state is compromised.",
        historicalFacts: [
          "Discontent among Murshidabad court nobility and wealthy merchant bankers created the political climate for the Plassey alliance."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "The treasury is burdened and the court is divided. When internal factionalism meets external commercial power, the state is compromised.",
            options: [
              {
                id: "o1",
                text: "What led to this deep internal division?",
                nextDialogueId: "n2"
              }
            ]
          },
          {
            id: "n2",
            prompt: "Disagreements over trade revenue, appointment of generals, and fear of financial ruin brought influential leaders together against the Nawab.",
            options: [
              {
                id: "o2",
                text: "Record this court analysis."
              }
            ]
          }
        ]
      },
      {
        id: "char_narrator_observer",
        name: "Historical Chronicler",
        title: "Observer of Palashi",
        historicalRole: "Historical Narrator & Scholar",
        personality: "Reflective, objective, articulate",
        spriteType: "scholar",
        characterImagePrompt: "Create a 2.5D RPG character portrait of an 18th-century Indian historical scholar in 1757, scholar robes, serene reflective expression, game character portrait",
        initialDialogue: "The rain has stopped over Palashi. On June 23, 1757, a battle of small military scale produced monumental historical consequences.",
        historicalFacts: [
          "The Battle of Plassey lasted only a few hours with relatively light casualties, yet it handed political control of Bengal to the East India Company.",
          "It established the foundation for the Company's Diwani rights (revenue collection) granted in 1765."
        ],
        dialogueTree: [
          {
            id: "n1",
            prompt: "The rain has stopped over Palashi. On June 23, 1757, a battle of small military scale produced monumental historical consequences.",
            options: [
              {
                id: "o1",
                text: "Complete the final historical sequence puzzle.",
                completesObjectiveId: "obj_scene6_aftermath"
              }
            ]
          }
        ]
      }
    ],
    quests: [
      {
        id: "q_plassey_expedition",
        title: "From Trade to Territory: Battle of Plassey",
        description: "Investigate how the East India Company transformed from a commercial trading entity into a territorial political power in Bengal in 1757.",
        rewardXP: 1000,
        puzzleId: "p_historical_sequence_puzzle",
        historicalInsight: "The Battle of Plassey (1757) demonstrated that the East India Company's rise to power was driven by political alliances, internal divisions, and military intervention rather than simple military conquest alone.",
        isCompleted: false,
        objectives: [
          {
            id: "obj_scene1_talk",
            description: "Understand the Company's original commercial role at the Camp Checkpoint",
            type: "SOLVE_PUZZLE",
            targetId: "p_company_role_puzzle",
            isCompleted: false
          },
          {
            id: "obj_scene2_rumours",
            description: "Investigate Camp Rumours regarding military alliances and Mir Jafar",
            type: "TALK_TO_NPC",
            targetId: "char_company_soldier",
            isCompleted: false
          },
          {
            id: "obj_scene3_market",
            description: "Identify key trade goods in the Bengal Market",
            type: "SOLVE_PUZZLE",
            targetId: "p_market_commerce_puzzle",
            isCompleted: false
          },
          {
            id: "obj_scene4_investigation",
            description: "Analyze the combination of political and military factors in Plassey",
            type: "SOLVE_PUZZLE",
            targetId: "p_plassey_political_puzzle",
            isCompleted: false
          },
          {
            id: "obj_scene5_court",
            description: "Investigate court factions and the Secret Treaty in the Royal Court",
            type: "TALK_TO_NPC",
            targetId: "char_siraj",
            isCompleted: false
          },
          {
            id: "obj_scene6_aftermath",
            description: "Complete the conceptual sequence: Trade to Territorial Power",
            type: "SOLVE_PUZZLE",
            targetId: "p_historical_sequence_puzzle",
            isCompleted: false
          }
        ]
      }
    ],
    evidence: [
      {
        id: "ev_trading_charter",
        title: "East India Company Royal Trading Charter (1700)",
        description: "Historical documentation confirming the East India Company was formed strictly as a commercial enterprise to trade textiles, spices, and tea.",
        historicalFact: "The East India Company was granted a English Royal Charter in 1600 as a trading firm. Its transition to military and political intervention began in the 18th century.",
        sourceCitation: "British Library India Office Records (EIC Charters)",
        iconType: "document",
        imageAsset: "/ai-expedition/plassey/props/company-trade-ledger.png",
        isDiscovered: false
      },
      {
        id: "ev_camp_rumours",
        title: "Overheard Camp Rumours: Loyalty is Uncertain",
        description: "Reports from soldiers confirming deep factional uncertainty within Siraj-ud-Daulah's military command.",
        historicalFact: "Mir Jafar, commander-in-chief of the Nawab's forces, held back 35,000 soldiers from engaging British forces during the Battle of Plassey.",
        sourceCitation: "Siyar-ul-Mutakherin (Historical Chronicle of 18th Century Bengal)",
        iconType: "letter",
        imageAsset: "/ai-expedition/plassey/props/bengal-trade-goods.png",
        isDiscovered: false
      },
      {
        id: "ev_bengal_trade_ledger",
        title: "Bengal Textile & Commerce Ledger (1757)",
        description: "Commercial ledger recording massive exports of silk, muslin, and saltpetre from Murshidabad to European markets.",
        historicalFact: "Bengal was the wealthiest province of the Mughal Empire, generating enormous trade revenues that attracted European trading companies.",
        sourceCitation: "Records of Murshidabad Mint & Customs Office",
        iconType: "document",
        imageAsset: "/ai-expedition/plassey/props/weighing-scale.png",
        isDiscovered: false
      },
      {
        id: "ev_power_balance_doc",
        title: "Analysis of Political Division at Plassey",
        description: "Administrative document showing how political division among Bengal elites enabled a smaller Company force to triumph.",
        historicalFact: "Robert Clive commanded approximately 3,000 troops (800 Europeans and 2,100 Sepoys), defeating a 50,000-strong army because two-thirds of the Nawab's troops were ordered not to fight.",
        sourceCitation: "Memoirs of Robert Clive & Bengal Secret Consultations",
        iconType: "map",
        imageAsset: "/ai-expedition/plassey/props/bengal-military-map.png",
        isDiscovered: false
      },
      {
        id: "ev_secret_treaty",
        title: "The Secret Treaty of Plassey (June 1757)",
        description: "A secret pact between Robert Clive, William Watts, Mir Jafar, and Jagat Seth bankers promising British military support to install Mir Jafar as Nawab in exchange for territorial and commercial monopolies.",
        historicalFact: "Signed on June 4, 1757, the treaty granted the East India Company 17.5 million rupees in compensation and the revenue rights of the 24 Parganas district.",
        sourceCitation: "Fort William Consultations, June 1757 (British Library Archives)",
        iconType: "document",
        imageAsset: "/ai-expedition/plassey/props/sealed-political-letter.png",
        isDiscovered: false
      },
      {
        id: "ev_plassey_aftermath_fact",
        title: "The Turning Point of British Power in India",
        description: "Historical record documenting the aftermath of Plassey as the pivotal moment when a merchant company secured territorial rule.",
        historicalFact: "Plassey established Mir Jafar as a puppet ruler, leading directly to the 1765 Treaty of Allahabad where the Mughal Emperor granted Diwani (tax collection) rights of Bengal, Bihar, and Odisha to the Company.",
        sourceCitation: "Treaty of Allahabad (1765) Archival Papers",
        iconType: "inscription",
        imageAsset: "/ai-expedition/plassey/props/musket.png",
        isDiscovered: false
      }
    ],
    puzzles: [
      {
        id: "p_company_role_puzzle",
        title: "The East India Company's Original Role",
        question: "Which description best matches the East India Company's original role when it first established operations in Bengal?",
        historicalContext: "Before raising armies or collecting territorial taxes, the East India Company operated under royal charters in Asian commercial ports.",
        options: [
          {
            id: "opt_trading",
            text: "Trading company focused on commercial export of goods",
            isCorrect: true,
            explanation: "Correct! The East India Company was originally established as a commercial trading enterprise to trade silk, spices, tea, and textiles."
          },
          {
            id: "opt_dynasty",
            text: "Bengal royal sovereign dynasty",
            isCorrect: false,
            explanation: "Incorrect. Bengal was ruled by the Nawabs of the Subah under the Mughal Empire, not the Company."
          },
          {
            id: "opt_religious",
            text: "Religious missionary order",
            isCorrect: false,
            explanation: "Incorrect. The Company was a joint-stock commercial enterprise, not a religious organization."
          },
          {
            id: "opt_village",
            text: "Agricultural farming cooperative",
            isCorrect: false,
            explanation: "Incorrect. The Company operated merchant trading ships and commercial factories."
          }
        ],
        hint: "Recall what merchant ships carried from Bengal to Europe.",
        historicalInsightUnlocked: "Trade was becoming entangled with political and military power.",
        isSolved: false
      },
      {
        id: "p_market_commerce_puzzle",
        title: "Bengal Commerce & Trade Foundation",
        question: "Identify the primary commercial items associated with Bengal's trade environment that made the province central to global commerce:",
        historicalContext: "Bengal's economic wealth was rooted in its world-famous artisanal manufacturing and agricultural exports.",
        options: [
          {
            id: "opt_textiles",
            text: "Silk & Fine Cotton Muslin Ledgers",
            isCorrect: true,
            explanation: "Correct! Bengal was renowned worldwide for its exquisite silk, cotton muslin, and spices, which formed the bedrock of Company trade."
          },
          {
            id: "opt_cannon",
            text: "Heavy European Siege Artillery",
            isCorrect: false,
            explanation: "Incorrect. Heavy artillery was military equipment imported by armies, not a primary commercial export of Bengal."
          },
          {
            id: "opt_crown",
            text: "Royal British Coronation Crowns",
            isCorrect: false,
            explanation: "Incorrect. European royal regalia had no relation to Bengal's market trade environment."
          },
          {
            id: "opt_sword",
            text: "Cavalry Swords only",
            isCorrect: false,
            explanation: "Incorrect. Arms were used by military forces, but textiles and spices dominated market commerce."
          }
        ],
        hint: "Look for the world-famous woven fabrics produced in Bengal's towns and villages.",
        historicalInsightUnlocked: "Commerce was one of the foundations of the Company's presence.",
        isSolved: false
      },
      {
        id: "p_plassey_political_puzzle",
        title: "The Plassey Power Balance",
        question: "Which combination of political circumstances best explains why the East India Company defeated a far larger force at Plassey in 1757?",
        historicalContext: "The Nawab possessed over 50,000 soldiers and heavy artillery, whereas Clive possessed only 3,000 men.",
        options: [
          {
            id: "opt_pol_div",
            text: "Political Division + Military Action",
            isCorrect: true,
            explanation: "Correct! The victory was determined by internal political defections (Mir Jafar and Jagat Seth) combined with Clive's decisive military maneuver during the monsoon rain."
          },
          {
            id: "opt_big_army",
            text: "The East India Company possessed the biggest army",
            isCorrect: false,
            explanation: "Incorrect. Siraj-ud-Daulah's army outnumbered British forces more than 15 to 1."
          },
          {
            id: "opt_luck",
            text: "Random coincidence without prior planning",
            isCorrect: false,
            explanation: "Incorrect. Secret negotiations had been conducted weeks before the battle was fought."
          },
          {
            id: "opt_surrender",
            text: "Immediate peaceful surrender of all Bengal forces",
            isCorrect: false,
            explanation: "Incorrect. Some divisions (such as Mir Madan's artillery) fought fiercely until Mir Madan was killed."
          }
        ],
        hint: "Consider how internal court politics and secret pacts affected army command.",
        historicalInsightUnlocked: "Plassey demonstrated the importance of political alliances and divisions alongside military force.",
        isSolved: false
      },
      {
        id: "p_historical_sequence_puzzle",
        title: "From Trade to Territory: Conceptual Sequence",
        question: "Arrange the developments representing the East India Company's transformation in Bengal into the correct conceptual sequence:",
        historicalContext: "Understand the multi-stage historical process through which a commercial enterprise acquired sovereign political control.",
        options: [
          {
            id: "opt_seq_correct",
            text: "TRADE → POLITICAL INVOLVEMENT → MILITARY INTERVENTION → TERRITORIAL / POLITICAL POWER",
            isCorrect: true,
            explanation: "Correct! The Company began with commercial trade, engaged in regional court politics, intervened militarily at Plassey, and established territorial revenue power."
          },
          {
            id: "opt_seq_wrong1",
            text: "MILITARY INTERVENTION → TRADE → RELIGIOUS CONVERSION → ROYAL DYNASTY",
            isCorrect: false,
            explanation: "Incorrect. Trade preceded military intervention by more than a century."
          },
          {
            id: "opt_seq_wrong2",
            text: "TERRITORIAL POWER → AGRICULTURAL VILLAGES → TRADE → PEACE TREATY",
            isCorrect: false,
            explanation: "Incorrect. Territorial power was the outcome, not the beginning."
          },
          {
            id: "opt_seq_wrong3",
            text: "DIPLOMACY → RELIGIOUS ORDER → NAVAL BLOCKADE → MONARCHY",
            isCorrect: false,
            explanation: "Incorrect. The Company never established a religious order or monarchy."
          }
        ],
        hint: "Start with the Company's original reason for arriving in India.",
        historicalInsightUnlocked: "From Trade to Territory",
        isSolved: false
      }
    ],
    learningObjectives: [
      {
        id: "lo_1",
        factTitle: "1. Original Commercial Enterprise",
        historicalFact: "The East India Company began strictly as a trading company chartered to exchange European goods for Indian textiles, spices, and tea.",
        citation: "EIC Charters & British Library Archives"
      },
      {
        id: "lo_2",
        factTitle: "2. Political & Military Expansion",
        historicalFact: "Political rivalries, trade permit disputes, and regional alliances led the Company to expand its military forces and intervene in local governance.",
        citation: "Records of the Fort William Council"
      },
      {
        id: "lo_3",
        factTitle: "3. Battle of Plassey (1757)",
        historicalFact: "The Battle of Plassey took place on June 23, 1757 near Palashi along the Bhagirathi River in Bengal.",
        citation: "Journal of Captain Alexander Grant (1757)"
      },
      {
        id: "lo_4",
        factTitle: "4. Command of Robert Clive",
        historicalFact: "Robert Clive commanded the East India Company's military forces, combining tactical field positioning with covert diplomacy.",
        citation: "Memoirs of Robert Clive"
      },
      {
        id: "lo_5",
        factTitle: "5. Nawab Siraj-ud-Daulah",
        historicalFact: "Siraj-ud-Daulah was the young Nawab of Bengal who sought to enforce state sovereignty and stop unauthorized British fortifications.",
        citation: "Siyar-ul-Mutakherin"
      },
      {
        id: "lo_6",
        factTitle: "6. Political Intrigue of Mir Jafar",
        historicalFact: "Mir Jafar's secret alliance with the Company and his decision to hold back two-thirds of the Nawab's army proved decisive at Plassey.",
        citation: "Plassey Secret Treaty Records (June 1757)"
      },
      {
        id: "lo_7",
        factTitle: "7. Establishment of Territorial Foothold",
        historicalFact: "The Company's victory at Plassey established its first major territorial and political foothold in Bengal, leading to the 1765 Diwani revenue rights.",
        citation: "Treaty of Allahabad (1765)"
      },
      {
        id: "lo_8",
        factTitle: "8. Trade to Territory Transformation",
        historicalFact: "The transition from commercial trade to territorial empire was driven by political alliances, internal court divisions, and strategic military intervention.",
        citation: "Cambridge History of India (Vol. V)"
      }
    ],
    expeditionEndingText: "You have completed the investigation of Plassey 1757! By following the messenger's journey through camp, market, and court, you have uncovered how internal divisions and covert political alliances—rather than mere force of numbers—allowed a commercial trading firm to secure a territorial empire in Bengal."
  }
};

