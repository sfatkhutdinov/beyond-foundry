Below is a detailed breakdown of how each of your scraped fields should map into the dnd5e `ClassData` schema along with an inline code example illustrating the assignments in your `parseClass` method.

---

## Field-to-Schema Mapping

| **Scraped Field**                                          | **Foundry Schema Path**                                    | **Type / Notes**                                                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `description`                                              | `system.description.value`                                 | string                                                                                                  |
| `source`                                                   | `system.source`                                            | string                                                                                                  |
| `tags`                                                     | `system.properties`                                        | `Set<string>`                                                                                           |
| `prerequisites`                                            | `system.prerequisites`                                     | `string[]`                                                                                              |
| **Hit Dice**                                               |                                                            |                                                                                                         |
| • `coreTraits["Hit Die"]`                                  | `system.hd.denomination`                                   | e.g. `"d8"`                                                                                             |
| • *additional HD from sidebar*                             | `system.hd.additional`                                     | string (formula)                                                                                        |
| • `hd.spent` default                                       | `system.hd.spent`                                          | number                                                                                                  |
| **Levels**                                                 |                                                            |                                                                                                         |
| • from DDBClass.level                                      | `system.levels`                                            | number                                                                                                  |
| **Primary Ability**                                        |                                                            |                                                                                                         |
| • `coreTraits["Primary Ability"]`                          | `system.primaryAbility.value`                              | split on “ and ” into an array, then `new Set([...])`                                                   |
| • always require all                                       | `system.primaryAbility.all`                                | boolean                                                                                                 |
| **Skill & Saving Throw Advances**                          |                                                            |                                                                                                         |
| • `coreTraits["Saving Throws"]`                            | push into `system.advancement` as a Trait type at level 1  | use `new TraitAdvancement({ type:"Trait", level:1, configuration:{ grants: […] } })`                    |
| • `coreTraits["Skill Proficiencies"]` (choose N from list) | likewise as a Trait advancement with choices at level 1    | use `AdvancementField` choice branch                                                                    |
| **Starting Equipment**                                     |                                                            |                                                                                                         |
| • `proxyData.startingEquipment`                            | provided to `StartingEquipmentTemplate` mixin              | `system.startingEquipment` is handled automatically by that template                                    |
| **Spellcasting**                                           |                                                            |                                                                                                         |
| • `spellLists` array                                       | `system.spellcasting.spellList` (or links)                 | depends on your field setup in `SpellcastingField`                                                      |
| • if class has casting                                     | `system.spellcasting.progression`                          | string (e.g. `"half-caster"`, `"full"`, `"none"`)                                                       |
| **Progression**                                            | `system.advancement` or a custom `progression` field       | you can choose to store raw rows under `system.advancement` (type `AdvancementField`) or on a new field |
| **Detailed Features**                                      | `system.features`                                          | Array of `{ name, description, level }`                                                                 |
| **Subclasses**                                             | `system.subclass` and/or `flags.beyond-foundry.subclasses` | `system.subclass.name`, `system.subclass.features`                                                      |
| **Sidebars**                                               | `flags.beyond-foundry.sidebars`                            | Array of strings                                                                                        |
| **Any Other Tables**                                       | `flags.beyond-foundry.additionalTables`                    | preserve `{ title, headers[], rows[][] }`                                                               |

---

## Inline Code Example

Here’s a trimmed-down snippet showing how you’d assign these in `parseClass`:

```ts
// After your existing proxyData extraction...
const proxy = proxyData?.data ?? {};

// 1. Base metadata
const description = proxy.description ?? '';
const source      = proxy.source      ?? '';
const tags        = proxy.tags        ?? [];
const prerequisites = proxy.prerequisites ?? [];

// 2. Hit Dice
const hdDenomination = proxy.coreTraits?.["Hit Die"]?.replace(/^Hit Die:\s*/i, "") ?? "d8";
const hdAdditional   = proxy.coreTraits?.["Unarmored Movement"]  // or dedicated sidebar entry
                       ? proxy.coreTraits["Unarmored Movement"]
                       : "";
const hdSpent        = 0;

// 3. Levels
const levels = ddbClass.level ?? 1;

// 4. Primary Abilities
const primAb = proxy.coreTraits?.["Primary Ability"] || "";
const primList = primAb.split(/\s+and\s+/i).map(s => s.trim());
const primaryAbility = {
  value: new Set(primList),
  all: true
};

// 5. Advancement for Saves & Skills
const advancement: any[] = [];

// 5a. Saving Throws (always at level 1)
if (proxy.coreTraits?.["Saving Throws"]) {
  const saves = proxy.coreTraits["Saving Throws"].split(/,\s*/);
  advancement.push(new TraitAdvancement({
    type: "Trait",
    level: 1,
    configuration: { grants: saves.map(s => `saves:${s}`) },
    value: { chosen: saves.map(s => `saves:${s}`) }
  }).toObject());
}

// 5b. Skill Proficiencies (choose N)
if (proxy.coreTraits?.["Skill Proficiencies"]) {
  const match = /choose (\d+)/i.exec(proxy.coreTraits["Skill Proficiencies"]);
  const count = match ? parseInt(match[1]) : 0;
  const options = proxy.coreTraits["Skill Proficiencies"]
                    .split(/:|\(|\)/)[1]
                    .split(/,\s*/);
  advancement.push(new TraitAdvancement({
    type: "Trait",
    level: 1,
    configuration: { choices: [{ count, pool: options.map(o => `skills:${o}`) }] },
    value: { chosen: [] }  // leave blank for user to choose
  }).toObject());
}

// 6. Spellcasting (if any)
const spellcasting = {
  progression: proxy.spellcasting?.progression || "none",
  ability:     proxy.coreTraits?.["Spellcasting Ability"]?.trim() || ""
};

// 7. Features & Subclasses
const features = (proxy.features || []).map(f => ({
  name:        f.name,
  description: f.description,
  level:       f.requiredLevel
}));
const subclass = {
  name:     proxy.subclasses?.[0]?.name || "",
  features: proxy.subclasses?.[0]?.description ? [ proxy.subclasses[0] ] : []
};

// 8. Put it all together
const foundryClass = {
  type: "class",
  name: ddbClass.definition.name,
  img: "",

  system: {
    description:    { value: description },
    source,
    hd: {
      denomination: hdDenomination,
      additional:   hdAdditional,
      spent:        hdSpent
    },
    levels,
    primaryAbility,
    properties: new Set(tags),
    prerequisites,
    advancement,
    spellcasting,
    features,
    subclass,
    // wire in other fields:
    progression: proxy.progression,
    coreTraits: proxy.coreTraits,
    sidebars: proxy.sidebars,
  },

  flags: {
    "beyond-foundry": {
      originalDDB: ddbClass,
      ...proxy  // you can tuck in everything raw here for debugging
    }
  }
};
```

> **Next Steps**
>
> 1. Copy the above mapping into your `parseClass` and replace stubbed assignments.
> 2. Run against a known class page and verify in the console that each schema field is populated.
> 3. Adjust any splits/parses for corner cases (e.g. “Half-caster” vs “Full-caster” progressions).

