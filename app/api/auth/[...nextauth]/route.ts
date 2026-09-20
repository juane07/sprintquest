import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

// Facilitator login only — participants always join anonymously via code.
// Google activates automatically once GOOGLE_CLIENT_ID/SECRET exist.
const providers: any[] = [
  GithubProvider({
    clientId: process.env.GITHUB_ID!,
    clientSecret: process.env.GITHUB_SECRET!,
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

const handler = NextAuth({
  providers,
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
