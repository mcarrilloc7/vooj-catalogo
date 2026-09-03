import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // session: undefined = todavía cargando, null = sin sesión, objeto = con sesión
  const [session, setSession] = useState(undefined)
  // perfil: undefined = sin cargar, null = el usuario no tiene perfil, objeto = perfil
  const [perfil, setPerfil] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion ?? null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return

    if (!session) {
      setPerfil(null)
      return
    }

    let cancelado = false
    setPerfil(undefined)

    supabase
      .from('perfiles')
      .select('nombre, rol')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) console.error('[auth] error al cargar perfil:', error)
        setPerfil(data ?? null)
      })

    return () => {
      cancelado = true
    }
  }, [session])

  const value = {
    session,
    user: session?.user ?? null,
    perfil,
    // true mientras no sabemos si hay sesión, o mientras cargamos el perfil
    cargando: session === undefined || (!!session && perfil === undefined),
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
