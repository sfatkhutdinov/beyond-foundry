# Spell Transformation Enhancement Analysis

## Overview

This analysis examines D&D Beyond spell data structures versus FoundryVTT D&D 5e schema to identify opportunities for leveraging all FoundryVTT spell functionalities and enhancing the spell transformation process in Beyond Foundry.

## D&D Beyond Spell Data Structure

Based on the imported spell data (`imported_spells.json`), D&D Beyond provides comprehensive spell information:

### Core Spell Properties
```typescript
interface DDBSpellDefinition {
  id: number;
  name: string;
  level: number;
  school: string;
  
  // Timing & Mechanics
  duration: {
    durationInterval: number;
    durationUnit: string;
    durationType: string;
  };
  activation: {
    activationTime: number;
    activationType: number;
  };
  
  // Range & Targeting
  range: {
    origin: string;
    rangeValue?: number;
    aoeType?: string;
    aoeValue?: number;
  };
  
  // Components
  components: number[];
  componentsDescription: string;
  concentration: boolean;
  ritual: boolean;
  
  // Effects & Mechanics
  description: string;
  saveDcAbilityId?: number;
  requiresSavingThrow: boolean;
  requiresAttackRoll: boolean;
  healing?: any;
  healingDice: any[];
  tempHpDice: any[];
  attackType?: number;
  
  // Scaling
  canCastAtHigherLevel: boolean;
  atHigherLevels: {
    higherLevelDefinitions: any[];
    additionalAttacks: any[];
    additionalTargets: any[];
    areaOfEffect: any[];
    duration: any[];
    creatures: any[];
    special: any[];
    points: any[];
    range: any[];
  };
  
  // Conditions & Effects
  conditions: Array<{
    type: number;
    conditionId: number;
    conditionDuration: number;
    durationUnit: string;
    exception?: string;
  }>;
  
  // Modifiers & Tags
  modifiers: any[];
  tags: string[];
  sources: Array<{
    sourceId: number;
    pageNumber?: number;
    sourceType: number;
  }>;
}
```

## FoundryVTT D&D 5e Spell Schema

FoundryVTT uses a modern activity-based system for spell automation:

### Core Spell Data Model
```typescript
interface FoundrySpellData {
  // Basic Properties
  ability: string;
  level: number;
  school: string;
  sourceClass: string;
  
  // Timing
  activation: ActivationData;
  duration: DurationData;
  
  // Components & Materials
  properties: Set<string>; // vocal, somatic, material, ritual, concentration
  materials: {
    value: string;
    consumed: boolean;
    cost: number;
    supply: number;
  };
  
  // Targeting
  range: RangeData;
  target: TargetData;
  
  // Preparation
  preparation: {
    mode: string;
    prepared: boolean;
  };
  
  // Activities (NEW FOUNDRY V12+ FEATURE)
  activities: Collection<ActivityData>;
}
```

### Activity System (Modern FoundryVTT)

FoundryVTT now uses an **Activity System** for spell automation with specific activity types:

#### 1. Attack Activities
```typescript
interface AttackActivity {
  attack: {
    ability: string;
    bonus: string;
    critical: { threshold: number };
    flat: boolean;
    type: {
      value: "melee" | "ranged";
      classification: "weapon" | "spell" | "unarmed";
    };
  };
  damage: {
    critical: { bonus: string };
    includeBase: boolean;
    parts: DamageData[];
  };
}
```

#### 2. Save Activities
```typescript
interface SaveActivity {
  save: {
    ability: Set<string>;
    dc: {
      calculation: string; // "spellcasting" | ability | "flat"
      formula: string;
    };
  };
  damage: {
    onSave: "half" | "none" | "full";
    parts: DamageData[];
  };
  effects: Array<{
    _id: string;
    onSave: boolean;
  }>;
}
```

#### 3. Damage Activities
```typescript
interface DamageActivity {
  damage: {
    critical: {
      allow: boolean;
      bonus: string;
    };
    parts: Array<{
      formula: string;
      types: Set<string>;
      scaling: {
        mode: "level" | "none";
        formula: string;
      };
    }>;
  };
}
```

#### 4. Utility Activities
```typescript
interface UtilityActivity {
  roll: {
    formula: string;
    ability: string;
    dc: number;
  };
}
```

#### 5. Cast Activities (Spell-in-Spell)
```typescript
interface CastActivity {
  spell: {
    ability: string;
    level: number;
    uuid: string;
    challenge: {
      attack: number;
      save: number;
      override: boolean;
    };
    properties: Set<string>;
    spellbook: boolean;
  };
}
```

## Current SpellParser Analysis

The existing `SpellParser` in Beyond Foundry handles basic conversion but **does NOT leverage the modern Activity System**:

### What's Currently Implemented ✅
- Basic spell properties (name, level, school)
- Component parsing (verbal, somatic, material)
- Duration and range conversion
- Preparation modes
- Scaling formulas (basic)
- Description formatting

### What's Missing for Full FoundryVTT Integration ❌

#### 1. Activity Generation
The parser doesn't create **Activities** for automation:
- No attack activities for spell attacks
- No save activities for saving throw spells
- No damage activities for damage spells
- No utility activities for ability checks
- No active effects for buffs/debuffs

#### 2. Advanced Automation Features
- Automatic damage calculation with scaling
- Saving throw automation with effects
- Attack roll automation
- Condition application
- Template placement automation
- Resource consumption tracking

#### 3. D&D Beyond Rich Data Utilization
Many D&D Beyond fields are ignored:
- `conditions` array → Could create Active Effects
- `modifiers` array → Could create modifiers
- `atHigherLevels` → Could create advanced scaling
- `healingDice` → Could create healing activities
- `attackType` → Could determine attack classification

## Enhancement Opportunities

### 1. Modern Activity System Integration

**High Priority**: Upgrade SpellParser to generate Activities based on spell type:

```typescript
// Example: Fireball spell transformation
const ddbSpell = {
  definition: {
    name: "Fireball",
    requiresSavingThrow: true,
    saveDcAbilityId: 4, // Intelligence
    // ... damage data
  }
};

// Should generate:
const foundrySpell = {
  name: "Fireball",
  activities: {
    "fireball-save": {
      type: "save",
      save: {
        ability: ["dex"],
        dc: { calculation: "spellcasting" }
      },
      damage: {
        onSave: "half",
        parts: [{ formula: "8d6", types: ["fire"] }]
      }
    }
  }
};
```

### 2. Condition & Effect Automation

**Medium Priority**: Convert D&D Beyond conditions to Active Effects:

```typescript
// D&D Beyond condition data
conditions: [
  {
    type: 1,
    conditionId: 12, // Incapacitated
    conditionDuration: 0,
    durationUnit: "Special"
  }
]

// Should create Active Effect:
effects: [{
  name: "Incapacitated",
  statuses: ["incapacitated"],
  duration: { rounds: 10 }, // parsed from spell duration
  changes: [
    {
      key: "system.attributes.movement.all",
      mode: "OVERRIDE",
      value: 0
    }
  ]
}]
```

### 3. Scaling Enhancement

**Medium Priority**: Utilize D&D Beyond's rich scaling data:

```typescript
// D&D Beyond higher level data
atHigherLevels: {
  higherLevelDefinitions: [
    { level: 2, definition: "additional 1d6 damage" }
  ]
}

// Should create scaling activity:
damage: {
  parts: [{
    formula: "1d6",
    scaling: {
      mode: "level",
      formula: "1d6"
    }
  }]
}
```

### 4. Attack Spell Enhancement

**High Priority**: Properly handle spell attacks:

```typescript
// D&D Beyond attack spell
{
  requiresAttackRoll: true,
  attackType: 2, // Ranged spell attack
  // damage data
}

// Should create attack activity:
activities: {
  "spell-attack": {
    type: "attack",
    attack: {
      type: {
        value: "ranged",
        classification: "spell"
      },
      ability: "", // Use spellcasting ability
    },
    damage: {
      parts: [{ formula: "1d10", types: ["force"] }]
    }
  }
}
```

### 5. Healing Spell Support

**Medium Priority**: Implement healing activities:

```typescript
// D&D Beyond healing data
{
  healing: { type: "healing" },
  healingDice: [{ diceCount: 1, diceValue: 8, fixedValue: 0 }]
}

// Should create healing activity:
activities: {
  "healing": {
    type: "heal",
    healing: {
      formula: "1d8 + @mod"
    }
  }
}
```

## Implementation Roadmap

### Phase 1: Activity System Foundation (High Priority)
1. **Update SpellParser to detect spell types**:
   - Attack spells (`requiresAttackRoll: true`)
   - Save spells (`requiresSavingThrow: true`)
   - Utility spells (neither attack nor save)
   - Healing spells (`healing` present)

2. **Create basic activity generators**:
   - `generateAttackActivity()`
   - `generateSaveActivity()`
   - `generateDamageActivity()`
   - `generateUtilityActivity()`

### Phase 2: Advanced Automation (Medium Priority)
3. **Implement condition mapping**:
   - Map D&D Beyond condition IDs to FoundryVTT status effects
   - Generate Active Effects from conditions array

4. **Enhanced scaling support**:
   - Parse `atHigherLevels` data structure
   - Create sophisticated scaling formulas

### Phase 3: Polish & Edge Cases (Lower Priority)
5. **Spell-specific enhancements**:
   - Template automation for AoE spells
   - Summon creature support
   - Transformation spells

6. **Quality of life improvements**:
   - Better error handling for malformed D&D Beyond data
   - Validation of generated activities
   - Performance optimization

## Code Structure Recommendations

### New Files to Create:
1. `src/parsers/spells/activities/` - Activity generators
2. `src/parsers/spells/effects/` - Active Effect generators  
3. `src/parsers/spells/scaling/` - Advanced scaling logic
4. `src/parsers/spells/conditions/` - Condition mapping

### SpellParser Enhancements:
```typescript
export class SpellParser {
  // Existing methods...
  
  // NEW: Activity generation
  private static generateActivities(definition: any): ActivityData[] {
    const activities: ActivityData[] = [];
    
    if (definition.requiresAttackRoll) {
      activities.push(this.generateAttackActivity(definition));
    }
    
    if (definition.requiresSavingThrow) {
      activities.push(this.generateSaveActivity(definition));
    }
    
    if (definition.healing) {
      activities.push(this.generateHealingActivity(definition));
    }
    
    return activities;
  }
  
  // NEW: Active Effects generation
  private static generateActiveEffects(definition: any): ActiveEffectData[] {
    return definition.conditions?.map(condition => 
      this.mapConditionToEffect(condition)
    ) || [];
  }
}
```

## Conclusion

The current SpellParser provides a solid foundation but **significantly underutilizes** FoundryVTT's modern automation capabilities. By implementing the Activity System and leveraging D&D Beyond's rich data, Beyond Foundry can provide spell automation that rivals or exceeds dedicated FoundryVTT modules.

**Key Benefits of Enhancement**:
- Full spell automation (attacks, saves, damage, healing)
- Automatic condition application
- Advanced scaling formulas
- Template placement for AoE spells
- Integration with FoundryVTT's combat system
- Reduced manual work for users

**Effort Estimate**: Medium to High complexity, but high impact for user experience.

**Recommended Priority**: Start with Phase 1 (Activity System Foundation) as it provides the most immediate value and enables future enhancements.
