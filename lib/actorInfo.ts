import { z } from 'zod'

/**
 * Static 200-word text containing information about multiple Hollywood actors.
 * Used as context for Q&A - users can ask questions like "what is the age of johnny depp".
 */
export const ACTOR_INFO_TEXT = `
Johnny Depp was born on June 9, 1963, in Owensboro, Kentucky. He is 61 years old and rose to fame with the television series 21 Jump Street. Depp is best known for his role as Captain Jack Sparrow in the Pirates of the Caribbean film series. He has collaborated extensively with director Tim Burton in films like Edward Scissorhands and Sweeney Todd.

Tom Hanks was born on July 9, 1956, in Concord, California. He is 68 years old and has won two Academy Awards for Best Actor, for Philadelphia and Forrest Gump. Hanks is one of the most successful actors in Hollywood history, with films like Saving Private Ryan, Cast Away, and The Terminal.

Meryl Streep was born on June 22, 1949, in Summit, New Jersey. She is 75 years old and holds the record for the most Academy Award nominations of any actor, with 21 nominations and 3 wins. Her notable films include The Devil Wears Prada, Sophie's Choice, and Kramer vs. Kramer.

Leonardo DiCaprio was born on November 11, 1974, in Los Angeles, California. He is 50 years old and won his first Academy Award for Best Actor in 2016 for The Revenant. He is known for Titanic, Inception, and The Wolf of Wall Street.
`.trim()

