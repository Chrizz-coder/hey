import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import db from "./db"

interface UserRow {
  id: number
  email: string
  name: string
  password_hash: string
  role: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = db.prepare(
          'SELECT * FROM users WHERE email = ?'
        ).get(credentials.email) as UserRow | undefined

        if (!user) {
          return null
        }

        const isValid = await compare(credentials.password, user.password_hash)

        if (!isValid) {
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin"
  },
  session: {
    strategy: "jwt"
  }
}

const handler = NextAuth(authOptions)

export const handlers = { GET: handler, POST: handler }

export const auth = () => getServerSession(authOptions)
