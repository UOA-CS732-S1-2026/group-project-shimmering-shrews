
const checkCategory = ( category: string, name: string ) => {
    // Based on seeded location and challenges
     if ( category.includes('catering') ) {
        return {
            name: 'Grab a bite',
            category_id: 1, // Food
            xp_worth: 10,
            description: `Grab something to eat or drink at ${ name }.`,
        };
    } 
    
    else if ( category.includes('leisure') ) {
         return {
            name: 'Talk to a stranger',
            category_id: 2, // Social
            xp_worth: 15,
            description: `Start a conversation with someone new at ${ name}.`,
        };
    }

    else if ( category.includes('fitness') ) {
         return {
            name: 'Workout session',
            category_id: 3, // Fitness
            xp_worth: 20,
            description: `Complete a workout at ${ name }.`,
        };
    }
    else {
         return {
            category_id: 0,
            xp_worth: 0,
            description: "UNKNOWN CATEGORY",
        };
    }
}


export const mapLocations = ( location: any ) => {
    const categoryInfo = checkCategory( location.category, location.name );
        
    return {
        name: categoryInfo.name,
        location_id: location.id,
        category_id: categoryInfo.category_id,
        xp_worth: categoryInfo.xp_worth,
        description: categoryInfo.description
    }
}