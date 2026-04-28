type LocationForChallenge = {
  id: number
  name: string
  category: string | null
}

type ChallengeCategoryIds = {
  food: number
  fitness: number
  social: number
}

const checkCategory = (category: string | null, name: string, categoryIds: ChallengeCategoryIds) => {
    const normalizedCategory = category ?? ''

    if ( normalizedCategory.includes('catering') ) {
        return {
            name: 'Grab a bite',
            category_id: categoryIds.food,
            xp_worth: 10,
            description: `Grab something to eat or drink at ${ name }.`,
        };
    } 
    
    else if ( normalizedCategory.includes('leisure') ) {
         return {
            name: 'Talk to a stranger',
            category_id: categoryIds.social,
            xp_worth: 15,
            description: `Start a conversation with someone new at ${ name}.`,
        };
    }

    else if ( normalizedCategory.includes('fitness') ) {
         return {
            name: 'Workout session',
            category_id: categoryIds.fitness,
            xp_worth: 20,
            description: `Complete a workout at ${ name }.`,
        };
    }
    else {
      throw new Error(`Unsupported location category '${normalizedCategory}' for ${name}`)
    }
}


export const mapLocations = (location: LocationForChallenge, categoryIds: ChallengeCategoryIds) => {
    const categoryInfo = checkCategory(location.category, location.name, categoryIds);
        
    return {
        name: categoryInfo.name,
        location_id: location.id,
        category_id: categoryInfo.category_id,
        xp_worth: categoryInfo.xp_worth,
        description: categoryInfo.description
    }
}
