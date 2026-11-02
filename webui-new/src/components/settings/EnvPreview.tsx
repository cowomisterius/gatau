import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { get } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface EnvInfo {
  name: string
  value: string
  is_default: boolean
  source?: string
  description?: string
}

interface EnvInfoResponse {
  host: string
  port: number
  insecure_public_defaults: boolean
  admin_password_set: boolean
  admin_password_weak: boolean
  accounts_total: number
  crypto: {
    enabled: boolean
    fernet_configured: boolean
  }
  cors: {
    origins: string[]
    allow_credentials: boolean
  }
  trusted_proxies: string[]
  model_routes_configured: boolean
  rate_limit: {
    enabled: boolean
    per_key: number
    per_ip: number
  }
  session_cache_ttl: number
  log_level: string
  log_format: string
  dsml_max_buffer_bytes: number
  uptime_secs: number
  server_version: string
  env_overrides: EnvInfo[]
}

export function EnvPreview() {
  const [info, setInfo] = useState<EnvInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    get<EnvInfoResponse>('/admin/api/env')
      .then((d) => !cancelled && setInfo(d))
      .catch((e) => {
        if (cancelled) return
        setError(String(e?.message ?? e))
        toast({ title: 'Gagal memuat informasi lingkungan', description: String(e?.message ?? e), variant: 'destructive' })
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [toast])

  if (loading && !info) {
    return <div className="text-sm text-muted-foreground">Memuat…</div>
  }
  if (error || !info) {
    return <div className="text-sm text-destructive">{error ?? 'Gagal memuat'}</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Runtime</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <Row k="Versi layanan" v={info.server_version} />
          <Row k="Alamat listen" v={`${info.host}:${info.port}`} />
          <Row k="Durasi aktif" v={info.uptime_secs > 0 ? `${Math.floor(info.uptime_secs / 60)}  menit` : '—'} />
          <Row k="Log" v={`${info.log_level} / ${info.log_format}`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Keamanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <Row
            k="Kata sandi admin"
            v={info.admin_password_weak ? '⚠ Kata sandi lemah (nilai default)' : 'Kata sandi kuat telah disetel'}
            warn={info.admin_password_weak}
          />
          <Row
            k="ALLOW_INSECURE_PUBLIC_DEFAULTS"
            v={info.insecure_public_defaults ? 'Diizinkan secara eksplisit' : 'false (aman)'}
            warn={info.insecure_public_defaults}
          />
          <Row
            k="Enkripsi kredensial"
            v={info.crypto.enabled ? `Fernet (${info.crypto.fernet_configured ? 'key telah dikonfigurasi' : 'key tidak ada'})` : 'Teks biasa'}
            warn={!info.crypto.enabled}
          />
          <Row
            k="Sumber yang diizinkan CORS"
            v={info.cors.origins.length === 0 ? 'Origin yang sama (default)' : info.cors.origins.join(', ')}
          />
          <Row
            k="Kredensial cookies"
            v={info.cors.allow_credentials ? 'Ya' : 'Tidak'}
          />
          <Row
            k="TRUSTED_PROXIES"
            v={info.trusted_proxies.length === 0 ? 'Tidak dikonfigurasi (XFF tidak dipercaya)' : info.trusted_proxies.join(', ')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pool akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <Row k="Total" v={String(info.accounts_total)} />
          <Row k="Metode konfigurasi" v="WebUI / data/accounts.json" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Perilaku</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <Row k="MODEL_ROUTES" v={info.model_routes_configured ? 'Dikonfigurasi' : 'Tidak dikonfigurasi (hanya menggunakan MODE/THINKING/SEARCH)'} />
          <Row k="Pembatasan laju" v={info.rate_limit.enabled ? `Aktif (per-key=${info.rate_limit.per_key}, per-ip=${info.rate_limit.per_ip})` : 'Nonaktif'} />
          <Row k="SESSION_CACHE_TTL" v={info.session_cache_ttl === 0 ? 'Dinonaktifkan' : `${info.session_cache_ttl} detik`} />
          <Row k="DSML_MAX_BUFFER_BYTES" v={info.dsml_max_buffer_bytes.toLocaleString('en-US')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Semua variabel lingkungan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Nama</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead className="w-[100px] text-right">Sumber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {info.env_overrides.map((e) => (
                <TableRow key={e.name}>
                  <TableCell className="font-mono text-xs">{e.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground break-all">
                    {e.value || <span className="italic">Kosong</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {e.is_default ? (
                      <Badge variant="outline">default</Badge>
                    ) : (
                      <Badge variant="secondary">set</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className={warn ? 'text-warning font-medium' : 'text-right'}>{v}</span>
    </div>
  )
}
