import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchCategoriesThunk,
  createCategoryThunk,
  updateCategoryThunk,
  deleteCategoryThunk,
  clearActionStatus,
} from '@/features/categories/categoriesSlice'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'

export default function AdminCategoriesPage() {
  const dispatch = useDispatch()
  const { items, status, error, actionStatus, actionError } = useSelector((s) => s.categories)

  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [createMode, setCreateMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { dispatch(fetchCategoriesThunk()) }, [dispatch])

  useEffect(() => {
    if (actionStatus === 'succeeded') {
      setEditId(null)
      setCreateMode(false)
      setNewName(''); setNewDesc(''); setNewIcon('')
      dispatch(clearActionStatus())
    }
  }, [actionStatus])

  function startEdit(cat) {
    setEditId(cat._id)
    setEditName(cat.name)
    setEditDesc(cat.description ?? '')
    setEditIcon(cat.icon ?? '')
  }

  function handleUpdate(e) {
    e.preventDefault()
    dispatch(updateCategoryThunk({ id: editId, data: { name: editName, description: editDesc || null, icon: editIcon || null } }))
  }

  function handleCreate(e) {
    e.preventDefault()
    dispatch(createCategoryThunk({ name: newName, description: newDesc || undefined, icon: newIcon || undefined }))
  }

  function handleDelete() {
    dispatch(deleteCategoryThunk(deleteTarget._id))
    setDeleteTarget(null)
  }

  const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500'

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Categories</h1>
          <p className="mt-1 text-sm text-muted">Tour categories used for filtering and navigation.</p>
        </div>
        {!createMode && (
          <Button onClick={() => setCreateMode(true)}>+ New category</Button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}
      {actionError && <ErrorMessage message={actionError} />}

      {/* Create form */}
      {createMode && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-ink">New category</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">Name *</label>
                <input required className={field} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Adventure" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">Icon emoji</label>
                <input className={field} value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="🏔️" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">Description</label>
                <input className={field} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" size="sm" loading={actionStatus === 'loading'}>Create</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setCreateMode(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {status === 'loading' ? (
        <div className="py-16"><Spinner center /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((cat) => (
                <tr key={cat._id} className="border-b border-gray-50 last:border-0">
                  {editId === cat._id ? (
                    <td colSpan={4} className="px-5 py-3">
                      <form onSubmit={handleUpdate} className="flex flex-wrap items-end gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-ink">Name</label>
                          <input required className={`${field} w-40`} value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-ink">Icon</label>
                          <input className={`${field} w-20`} value={editIcon} onChange={(e) => setEditIcon(e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-ink">Description</label>
                          <input className={`${field} w-52`} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" loading={actionStatus === 'loading'}>Save</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-2">
                          {cat.icon && <span className="text-lg">{cat.icon}</span>}
                          <span className="font-medium text-ink">{cat.name}</span>
                        </span>
                        {cat.description && <p className="mt-0.5 text-xs text-muted">{cat.description}</p>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted">{cat.slug}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-3">
                          <button onClick={() => startEdit(cat)} className="text-xs font-medium text-brand-600 hover:underline">Edit</button>
                          <button
                            onClick={() => dispatch(updateCategoryThunk({ id: cat._id, data: { isActive: !cat.isActive } }))}
                            className="text-xs font-medium text-muted hover:underline"
                          >
                            {cat.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => setDeleteTarget(cat)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} className="py-16 text-center text-sm text-muted">No categories yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-semibold text-ink">Delete "{deleteTarget.name}"?</h2>
            <p className="mb-5 text-sm text-muted">This will fail if tours are using this category.</p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
