"use client"
export function Button(props: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-bold transition ${props.className ?? "bg-gold text-black hover:bg-yellow-400"}`}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}

export function Input(props: { placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <input
      type={props.type ?? "text"}
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400"
    />
  )
}

export function Card(props: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-xl p-6 ${props.className ?? ""}`}>
      {props.children}
    </div>
  )
}

export function Badge({ name, description }: { name: string; description?: string }) {
  return (
    <div className="bg-gold/20 border border-gold rounded-lg px-3 py-1 text-gold text-sm font-bold">
      {name}
    </div>
  )
}
