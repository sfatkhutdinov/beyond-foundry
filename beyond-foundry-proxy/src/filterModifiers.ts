/**
 * UTILITY
 * Returns a string representation of friendlyTypename and friendlySubtypeName for an obj[]
 * @param {object[]} arr array of objects
 */
function extractInfo(arr: any[]): string[] {
    return arr.map((e: any) => `${e.friendlyTypeName} (${e.friendlySubtypeName})`);
}

/**
 * Extracts basic character information
 * @param {object} data Character JSON
 * returns information about the classes this character chose, including
 * - {string} name
 * - {number} level
 * - {boolean} isStartingClass
 * - {object[]} modifiers (empty, will be filled later)
 * }
 */
function getClassInfo(data: any): any[] {
    return data.classes.map((cls: any) => {
        return {
            name: cls.subclassDefinition && cls.subclassDefinition.name
                ? `${cls.definition.name} (${cls.subclassDefinition.name})`
                : cls.definition.name,
            level: cls.level,
            isStartingClass: cls.isStartingClass,
            modifiers: [],
        };
    });
}
/**
 * Gets all class features up to a certain class level
 * @param {obj} cls character.classes[] entry
 * @param {*} classLevel level requirement up to which the class features should be extracted
 */
function getClassFeatures(cls: any, classLevel: number = 20): any[] {
    if (cls.subclassDefinition
        && cls.subclassDefinition.classFeatures
        && Array.isArray(cls.subclassDefinition.classFeatures)) {
        return cls.classFeatures
            .map((feature: any) => feature.definition)
            .concat(cls.subclassDefinition.classFeatures)
            .filter((classFeature: any) => classFeature.requiredLevel <= classLevel)
            .sort((a: any, b: any) => a.requiredLevel - b.requiredLevel);
    }
    else {
        return cls.classFeatures
            .map((feature: any) => feature.definition)
            .filter((classFeature: any) => classFeature.requiredLevel <= classLevel)
            .sort((a: any, b: any) => a.requiredLevel - b.requiredLevel);
    }
}
/**
 * Checks if a given class is the starting class of this character
 * @param {object} data character data
 * @param {string} className name of the class to check
 * @returns {boolean} true of the class is a starting class, false otherwise
 */
function isStartingClass(data: any, className: string): boolean {
    return !!data.classes.find((cls: any) => cls.definition.name === className && cls.isStartingClass);
}
/**
 * Gets all class modifiers for a given character
 * This filters out all modifiers that do not have an entry in the class features passed in
 * For multiclassing characters, it checks if the given class is the starting class or a multiclass,
 *    then the `.availableToMulticlass` is queried if this modifier is enabled or not
 * @param {obj} cls character.classes[] entry
 * @param {*} classLevel level requirement up to which the class features should be extracted
 */
function getClassModifiers(data: any, classFeatures: any[], isStartingClass: boolean = false): any[] {
    const modifiers = data.modifiers.class.filter((classModifier: any) => {
        // check the class from which this modifier came
        const componentId = classModifier.componentId;
        //const feature = classFeatures.find(feature => feature.id === componentId || chosenOptions.includes(feature.id));
        const feature = classFeatures.find((feature: any) => feature.id === componentId);
        if (feature !== undefined) {
            const isFeatureAvailable = classModifier.availableToMulticlass ? true : isStartingClass;
            console.log(`${isFeatureAvailable ? "  [  AVAIL]" : "  [UNAVAIL]"} Modifier found: ${classModifier.friendlyTypeName} (${classModifier.friendlySubtypeName})`);
            return isFeatureAvailable;
        }
        return false;
    });
    return modifiers;
}
function getClassOptionModifiers(data: any): any[] {
    const classFeatures = data.classes.map((cls: any) => {
        return getClassFeatures(cls, cls.level);
    }).flat();
    const modifiers = data.modifiers.class.filter((classModifier: any) => {
        const componentId = classModifier.componentId;
        const feature = classFeatures.find((feature: any) => feature.id === componentId);
        if (feature === undefined) {
            console.log(`  [  EXTRA] Modifier found: ${classModifier.friendlyTypeName} (${classModifier.friendlySubtypeName})`);
            return true;
        }
        return false;
    });
    return modifiers;
}
/**
 * Filters the modifiers with the utility functions above
 * @param {object} data character data
 * @returns {[object[]]} an array containing an array of filtered modifiers, grouped by class
 */
function filterModifiers(data: any, classInfo: any[]): any[] {
    // get the classFeatures for all classes
    //const classInfo = getClassInfo(data);
    data.classes.forEach((cls: any, index: number) => {
        const features = getClassFeatures(cls, cls.level);
        classInfo[index].modifiers = getClassModifiers(data, features, isStartingClass(data, cls.definition.name));
    });
    return classInfo;
}
/**
 * =============================================================
 * MAIN
 * =============================================================
 * Get the class information for this character
 */
function main(data: any): any {
    console.log("[ MODIFIERS ====================================================== ]");
    const classInfo = getClassInfo(data.character);
    const filteredClassInfo = filterModifiers(data.character, classInfo);
    let classModifiers = getClassOptionModifiers(data.character);
    console.log("");
    filteredClassInfo.forEach((cls: any) => {
        console.log(`${cls.isStartingClass ? "Starting Class" : "Multiclass"}: [lvl${cls.level}] ${cls.name} `);
        console.log(extractInfo(cls.modifiers)
            .map((s: string) => `    ${s}`)
            .join("\n"));
        classModifiers = classModifiers.concat(cls.modifiers);
    });
    data.character.modifiers.class = classModifiers;
    return data;
}
export default main;
